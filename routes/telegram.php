<?php

/** @var Nutgram $bot */

use App\Models\Driving;
use App\Models\Review;
use App\Models\Student;
use App\Models\User;
use SergiX44\Nutgram\Nutgram;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardMarkup;
use SergiX44\Nutgram\Telegram\Types\Keyboard\KeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\ReplyKeyboardMarkup;
use SergiX44\Nutgram\Telegram\Types\Keyboard\ReplyKeyboardRemove;
use SergiX44\Nutgram\Telegram\Types\WebApp\WebAppInfo;

/*
|--------------------------------------------------------------------------
| Nutgram Handlers
|--------------------------------------------------------------------------
|
| Here is where you can register telegram handlers for Nutgram. These
| handlers are loaded by the NutgramServiceProvider. Enjoy!
|
*/

$bot->onCommand('start', function (Nutgram $bot) {
    $telegramId = $bot->userId();
    $user = User::where('telegram_id', $telegramId)->first();

    if ($user) {
        $appUrl = config('app.url');
        if (! str_starts_with($appUrl, 'https://')) {
            $appUrl = preg_replace('/^http:/i', 'https:', $appUrl);
        }

        $keyboard = InlineKeyboardMarkup::make()
            ->addRow(InlineKeyboardButton::make(
                '🚀 Mini App ni ochish',
                web_app: new WebAppInfo($appUrl)
            ));

        try {
            $bot->sendMessage("Assalomu alaykum, {$user->name}! Tizimga xush kelibsiz.", reply_markup: $keyboard);
        } catch (Exception $e) {
            $bot->sendMessage("Assalomu alaykum, {$user->name}! Tizimga xush kelibsiz.\n\n⚠️ Diqqat: Telegram Mini App faqat haqiqiy (public) HTTPS domenlar bilan ishlaydi. Sizning tizimingiz hozirda localhost da ishlayapti, shuning uchun Mini App tugmasini yuborib bo'lmadi. APP_URL ni to'g'rilang.");
        }

        return;
    }

    $keyboard = ReplyKeyboardMarkup::make(resize_keyboard: true)
        ->addRow(
            KeyboardButton::make('📱 Telefon raqamni yuborish', request_contact: true)
        );

    $bot->sendMessage(
        text: 'Assalomu alaykum! Tizimga kirish uchun telefon raqamingizni yuboring:',
        reply_markup: $keyboard
    );
})->description('Botni ishga tushirish');

$bot->onContact(function (Nutgram $bot) {
    $contact = $bot->message()->contact;

    if ($contact->user_id !== $bot->userId()) {
        $bot->sendMessage("Iltimos, faqat o'zingizning telefon raqamingizni pastdagi tugma orqali yuboring.");

        return;
    }

    $telegramId = $bot->userId();
    $phone = $contact->phone_number;

    // Normalize phone (sometimes Telegram returns with or without +)
    if (! str_starts_with($phone, '+')) {
        $phone = '+'.$phone;
    }

    $user = User::where('phone', $phone)->first();
    if ($user) {
        $user->update(['telegram_id' => $telegramId]);
        $bot->sendMessage("Muvaffaqiyatli avtorizatsiyadan o'tdingiz, {$user->name}!",
            reply_markup: ReplyKeyboardRemove::make(true)
        );

        $appUrl = config('app.url');
        if (! str_starts_with($appUrl, 'https://')) {
            $appUrl = preg_replace('/^http:/i', 'https:', $appUrl);
        }

        $keyboard = InlineKeyboardMarkup::make()
            ->addRow(InlineKeyboardButton::make(
                '🚀 Mini App ni ochish',
                web_app: new WebAppInfo($appUrl)
            ));

        try {
            $bot->sendMessage('Mini ilovaga kirish uchun quyidagi tugmani bosing:', reply_markup: $keyboard);
        } catch (Exception $e) {
            $bot->sendMessage("⚠️ Diqqat: Telegram Mini App faqat haqiqiy (public) HTTPS domenlar bilan ishlaydi. Hozirda tizim localhost da ishlayotgani sababli Mini App tugmasi yuborilmadi. APP_URL ni to'g'rilang.");
        }

        return;
    }

    $student = Student::where('phone', $phone)->first();

    if ($student) {
        $student->update(['telegram_id' => $telegramId]);
        $bot->sendMessage("Muvaffaqiyatli avtorizatsiyadan o'tdingiz, {$student->full_name}!",
            reply_markup: ReplyKeyboardRemove::make(true)
        );
    } else {
        $bot->sendMessage("Kechirasiz, tizimda ushbu raqam bilan o'quvchi yoki xodim topilmadi.");
    }
});

// Handle callback queries for rating: rate:{driving_id}:{rating}
$bot->onCallbackQueryData('rate:{driving_id}:{rating}', function (Nutgram $bot, $driving_id, $rating) {
    $driving = Driving::find($driving_id);
    if (! $driving) {
        $bot->answerCallbackQuery(text: "Mashg'ulot topilmadi.");

        return;
    }

    if ($driving->student->telegram_id != $bot->userId()) {
        $bot->answerCallbackQuery(text: "Bu sizning mashg'ulotingiz emas.");

        return;
    }

    $rating = (int) $rating;

    // Send reason tags inline keyboard based on rating
    $keyboard = InlineKeyboardMarkup::make();

    if ($rating >= 4) {
        $tags = ['🧠 Zargona tushuntirdi', '✨ Xushmuomala', '🧼 Mashina toza', '⏰ Vaqtida boshladi'];
    } else {
        $tags = ['⏰ Kechikdi', '🗣 Muomala yomon', '🚗 Mashina nosoz', '⏳ Vaqtidan kam o\'tildi'];
    }

    foreach ($tags as $index => $tag) {
        $keyboard->addRow(
            InlineKeyboardButton::make(
                $tag,
                callback_data: "tag:{$driving_id}:{$rating}:{$index}"
            )
        );
    }

    $keyboard->addRow(
        InlineKeyboardButton::make(
            '✅ Yuborish',
            callback_data: "submit_rate:{$driving_id}:{$rating}"
        )
    );

    $bot->editMessageText("Sizning bahoingiz: {$rating} yulduz.\nIltimos, qo'shimcha sabablarni tanlang:", reply_markup: $keyboard);
});

// We need a mechanism to store selected tags in memory or cache before submitting,
// but for simplicity in this stateless flow, we can just save a default tag or
// store them directly if clicked.
// A better approach for this simplified task is to just submit the rating with the selected tag immediately.
// Let's modify the above to just submit the rating and tag in one click.

$bot->onCallbackQueryData('tag:{driving_id}:{rating}:{tag_index}', function (Nutgram $bot, $driving_id, $rating, $tag_index) {
    $driving = Driving::find($driving_id);
    if (! $driving) {
        return;
    }

    $rating = (int) $rating;
    $tag_index = (int) $tag_index;

    if ($rating >= 4) {
        $tags = ['🧠 Zargona tushuntirdi', '✨ Xushmuomala', '🧼 Mashina toza', '⏰ Vaqtida boshladi'];
    } else {
        $tags = ['⏰ Kechikdi', '🗣 Muomala yomon', '🚗 Mashina nosoz', '⏳ Vaqtidan kam o\'tildi'];
    }

    $selectedTag = $tags[$tag_index] ?? null;

    Review::updateOrCreate(
        ['driving_id' => $driving->id],
        [
            'rating' => $rating,
            'reason_tags' => $selectedTag ? [$selectedTag] : null,
        ]
    );

    $bot->editMessageText('Rahmat! Bahoingiz va fikringiz qabul qilindi.');
});

$bot->onCallbackQueryData('submit_rate:{driving_id}:{rating}', function (Nutgram $bot, $driving_id, $rating) {
    $driving = Driving::find($driving_id);
    if (! $driving) {
        return;
    }

    Review::updateOrCreate(
        ['driving_id' => $driving->id],
        [
            'rating' => (int) $rating,
            'reason_tags' => [],
        ]
    );

    $bot->editMessageText('Rahmat! Bahoingiz qabul qilindi.');
});
