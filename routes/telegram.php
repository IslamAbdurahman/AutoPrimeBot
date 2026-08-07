<?php

/** @var Nutgram $bot */

use App\Models\Driving;
use App\Models\Review;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
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
    $student = Student::where('telegram_id', $telegramId)->first();

    if ($user) {
        $roleTitle = $user->role === 'instructor' ? '👨‍🏫 Instruktor' : '👑 Admin';
        $appUrl = config('app.url');
        if (! str_starts_with($appUrl, 'https://')) {
            $appUrl = preg_replace('/^http:/i', 'https:', $appUrl);
        }

        $keyboard = InlineKeyboardMarkup::make()
            ->addRow(InlineKeyboardButton::make(
                '🚀 Mini App ni ochish',
                web_app: new WebAppInfo($appUrl)
            ));

        $msg = "📌 <b>Tizimga kirildi: {$roleTitle}</b>\n\nAssalomu alaykum, <b>{$user->name}</b>! AutoPrime tizimiga xush kelibsiz.";

        try {
            $bot->sendMessage($msg, parse_mode: 'HTML', reply_markup: $keyboard);
        } catch (Exception $e) {
            $bot->sendMessage("{$msg}\n\n⚠️ Diqqat: Telegram Mini App faqat haqiqiy (public) HTTPS domenlar bilan ishlaydi. APP_URL ni to'g'rilang.", parse_mode: 'HTML');
        }

        return;
    }

    if ($student) {
        $roleTitle = "🎓 O'quvchi";
        $appUrl = config('app.url');
        if (! str_starts_with($appUrl, 'https://')) {
            $appUrl = preg_replace('/^http:/i', 'https:', $appUrl);
        }

        $keyboard = InlineKeyboardMarkup::make()
            ->addRow(InlineKeyboardButton::make(
                '🚀 Mini App ni ochish',
                web_app: new WebAppInfo($appUrl)
            ));

        $msg = "📌 <b>Tizimga kirildi: {$roleTitle}</b>\n\nAssalomu alaykum, <b>{$student->full_name}</b>! AutoPrime o'quvchi botiga xush kelibsiz.";

        try {
            $bot->sendMessage($msg, parse_mode: 'HTML', reply_markup: $keyboard);
        } catch (Exception $e) {
            $bot->sendMessage($msg, parse_mode: 'HTML');
        }

        return;
    }

    $keyboard = ReplyKeyboardMarkup::make(resize_keyboard: true)
        ->addRow(
            KeyboardButton::make('📱 Telefon raqamni yuborish', request_contact: true)
        );

    $bot->sendMessage(
        text: 'Assalomu alaykum! Tizimga kirish uchun pastdagi tugma orqali telefon raqamingizni yuboring:',
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

    $cleanPhone = str_replace('+', '', $phone);

    $user = User::where('phone', $phone)->orWhere('phone', $cleanPhone)->first();
    if ($user) {
        $user->update(['telegram_id' => $telegramId]);
        $roleTitle = $user->role === 'instructor' ? '👨‍🏫 Instruktor' : '👑 Admin';

        $bot->sendMessage(
            "✅ Muvaffaqiyatli avtorizatsiyadan o'tdingiz!\n\n👤 <b>Ismingiz:</b> {$user->name}\n📌 <b>Siz tizimga <u>{$roleTitle}</u> sifatida kirdingiz.</b>",
            parse_mode: 'HTML',
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
            $bot->sendMessage('⚠️ Diqqat: Telegram Mini App faqat haqiqiy (public) HTTPS domenlar bilan ishlaydi.');
        }

        return;
    }

    $student = Student::where('phone', $phone)->orWhere('phone', $cleanPhone)->first();

    if ($student) {
        $student->update(['telegram_id' => $telegramId]);
        $roleTitle = "🎓 O'quvchi";

        $bot->sendMessage(
            "✅ Muvaffaqiyatli avtorizatsiyadan o'tdingiz!\n\n👤 <b>Ismingiz:</b> {$student->full_name}\n📌 <b>Siz tizimga <u>{$roleTitle}</u> sifatida kirdingiz.</b>",
            parse_mode: 'HTML',
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
            $bot->sendMessage('⚠️ Diqqat: Telegram Mini App faqat haqiqiy (public) HTTPS domenlar bilan ishlaydi.');
        }
    } else {
        $bot->sendMessage("Kechirasiz, tizimda ushbu raqam bilan o'quvchi yoki xodim topilmadi.");
    }
});

// Handle callback queries for rating: rate:{driving_id}:{rating}
function getAvailableRatingTags(int $rating): array
{
    return $rating >= 4
        ? ['🧠 Zargona tushuntirdi', '✨ Xushmuomala', '🧼 Mashina toza', '⏰ Vaqtida boshladi']
        : ['⏰ Kechikdi', '🗣 Muomala yomon', '🚗 Mashina nosoz', '⏳ Vaqtidan kam o\'tildi'];
}

function buildTagKeyboard(int $drivingId, int $rating, array $selectedIndices = []): InlineKeyboardMarkup
{
    $keyboard = InlineKeyboardMarkup::make();
    $tags = getAvailableRatingTags($rating);

    foreach ($tags as $index => $tag) {
        $isSelected = in_array($index, $selectedIndices, true);
        $prefix = $isSelected ? '☑️ ' : '⬜ ';
        $keyboard->addRow(
            InlineKeyboardButton::make(
                $prefix.$tag,
                callback_data: "tag_toggle:{$drivingId}:{$rating}:{$index}"
            )
        );
    }

    $keyboard->addRow(
        InlineKeyboardButton::make(
            '✅ Yuborish',
            callback_data: "submit_rate:{$drivingId}:{$rating}"
        )
    );

    return $keyboard;
}

$bot->onCallbackQueryData('rate:{driving_id}:{rating}', function (Nutgram $bot, $driving_id, $rating) {
    $driving = Driving::find($driving_id);
    if (! $driving) {
        $bot->answerCallbackQuery(text: "Mashg'ulot topilmadi.");

        return;
    }

    if ($driving->student && $driving->student->telegram_id != $bot->userId()) {
        $bot->answerCallbackQuery(text: "Bu sizning mashg'ulotingiz emas.");

        return;
    }

    $rating = (int) $rating;
    $cacheKey = "driving_review_{$driving_id}";
    Cache::put($cacheKey, ['rating' => $rating, 'selected' => []], now()->addHours(2));

    $keyboard = buildTagKeyboard((int) $driving_id, $rating, []);
    $bot->editMessageText(
        "Sizning bahoingiz: {$rating} ⭐\nIltimos, qo'shimcha sabablarni tanlang (bir nechta tanlash mumkin):",
        reply_markup: $keyboard
    );
    $bot->answerCallbackQuery();
});

$bot->onCallbackQueryData('tag_toggle:{driving_id}:{rating}:{tag_index}', function (Nutgram $bot, $driving_id, $rating, $tag_index) {
    $driving = Driving::find($driving_id);
    if (! $driving) {
        $bot->answerCallbackQuery(text: "Mashg'ulot topilmadi.");

        return;
    }

    if ($driving->student && $driving->student->telegram_id != $bot->userId()) {
        $bot->answerCallbackQuery(text: "Bu sizning mashg'ulotingiz emas.");

        return;
    }

    $rating = (int) $rating;
    $tagIndex = (int) $tag_index;
    $cacheKey = "driving_review_{$driving_id}";
    $data = Cache::get($cacheKey, ['rating' => $rating, 'selected' => []]);

    $selected = $data['selected'] ?? [];
    if (in_array($tagIndex, $selected, true)) {
        $selected = array_values(array_filter($selected, fn ($i) => $i !== $tagIndex));
    } else {
        $selected[] = $tagIndex;
    }

    $data['selected'] = $selected;
    Cache::put($cacheKey, $data, now()->addHours(2));

    $keyboard = buildTagKeyboard((int) $driving_id, $rating, $selected);
    $bot->editMessageText(
        "Sizning bahoingiz: {$rating} ⭐\nIltimos, qo'shimcha sabablarni tanlang (bir nechta tanlash mumkin):",
        reply_markup: $keyboard
    );
    $bot->answerCallbackQuery();
});

$bot->onCallbackQueryData('submit_rate:{driving_id}:{rating}', function (Nutgram $bot, $driving_id, $rating) {
    $driving = Driving::find($driving_id);
    if (! $driving) {
        $bot->answerCallbackQuery(text: "Mashg'ulot topilmadi.");

        return;
    }

    if ($driving->student && $driving->student->telegram_id != $bot->userId()) {
        $bot->answerCallbackQuery(text: "Bu sizning mashg'ulotingiz emas.");

        return;
    }

    $rating = (int) $rating;
    $cacheKey = "driving_review_{$driving_id}";
    $data = Cache::get($cacheKey, ['rating' => $rating, 'selected' => []]);
    $selectedIndices = $data['selected'] ?? [];

    $allTags = getAvailableRatingTags($rating);
    $selectedTags = [];
    foreach ($selectedIndices as $idx) {
        if (isset($allTags[$idx])) {
            $selectedTags[] = $allTags[$idx];
        }
    }

    Review::updateOrCreate(
        ['driving_id' => $driving->id],
        [
            'rating' => $rating,
            'reason_tags' => $selectedTags,
        ]
    );

    Cache::forget($cacheKey);

    $tagsText = ! empty($selectedTags) ? "\n📝 Izohlar: ".implode(', ', $selectedTags) : '';
    $bot->editMessageText("⭐ Bahoingiz: {$rating} yulduz{$tagsText}\n\n✅ Rahmat! Bahoingiz va fikringiz qabul qilindi.");
    $bot->answerCallbackQuery(text: 'Bahoingiz saqlandi!');
});
