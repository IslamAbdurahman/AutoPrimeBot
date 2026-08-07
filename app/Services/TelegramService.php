<?php

namespace App\Services;

use App\Models\Driving;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use SergiX44\Nutgram\Nutgram;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardMarkup;

class TelegramService
{
    public function __construct(protected ?Nutgram $bot = null) {}

    protected function getBot(): ?Nutgram
    {
        if ($this->bot) {
            return $this->bot;
        }

        try {
            return app(Nutgram::class);
        } catch (\Throwable $e) {
            Log::warning('TelegramService Nutgram bot instance could not be resolved: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Send notification when a driving lesson is scheduled.
     */
    public function sendDrivingCreatedNotification(Driving $driving): void
    {
        $bot = $this->getBot();
        if (! $bot) {
            return;
        }

        $driving->loadMissing(['student', 'instructor', 'autodrome']);
        $student = $driving->student;
        $instructor = $driving->instructor;
        $autodrome = $driving->autodrome;

        if (! $student || ! $student->telegram_id) {
            return;
        }

        $dateFormatted = Carbon::parse($driving->start_time)->format('d.m.Y');
        $startTime = Carbon::parse($driving->start_time)->format('H:i');
        $endTime = Carbon::parse($driving->end_time)->format('H:i');

        $text = "🚗 <b>Yangi amaliy mashg'ulot belgilandi!</b>\n\n";
        $text .= "📅 <b>Sana:</b> {$dateFormatted}\n";
        $text .= "⏰ <b>Vaqt:</b> {$startTime} - {$endTime}\n";
        if ($instructor) {
            $text .= "👨‍🏫 <b>Instruktor:</b> {$instructor->name}\n";
        }
        if ($autodrome) {
            $text .= "📍 <b>Avtodrom:</b> {$autodrome->name}\n";
        }

        try {
            $bot->sendMessage(
                text: $text,
                chat_id: $student->telegram_id,
                parse_mode: 'HTML'
            );

            if ($autodrome && $autodrome->latitude && $autodrome->longitude) {
                $bot->sendLocation(
                    latitude: (float) $autodrome->latitude,
                    longitude: (float) $autodrome->longitude,
                    chat_id: $student->telegram_id
                );
            }
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram driving created notification to student {$student->id}: ".$e->getMessage());
        }
    }

    /**
     * Send notification & rating prompt when a driving lesson is completed.
     */
    public function sendLessonRatingPrompt(Driving $driving): void
    {
        $bot = $this->getBot();
        if (! $bot) {
            return;
        }

        $driving->loadMissing(['student', 'instructor']);
        $student = $driving->student;
        $instructor = $driving->instructor;

        if (! $student || ! $student->telegram_id) {
            return;
        }

        $instructorName = $instructor ? $instructor->name : 'Instruktor';

        $text = "✅ <b>Mashg'ulotingiz yakunlandi!</b>\n\n";
        $text .= "👨‍🏫 <b>Instruktor:</b> {$instructorName}\n\n";
        $text .= "Iltimos, mashg'ulot sifatini baholang (1-5):";

        $keyboard = InlineKeyboardMarkup::make();
        for ($i = 1; $i <= 5; $i++) {
            $keyboard->addRow(
                InlineKeyboardButton::make(str_repeat('⭐', $i), callback_data: "rate:{$driving->id}:{$i}")
            );
        }

        try {
            $bot->sendMessage(
                text: $text,
                chat_id: $student->telegram_id,
                parse_mode: 'HTML',
                reply_markup: $keyboard
            );
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram driving rating prompt to student {$student->id}: ".$e->getMessage());
        }
    }

    /**
     * Send notification when a driving lesson is cancelled.
     */
    public function sendDrivingCancelledNotification(Driving $driving): void
    {
        $bot = $this->getBot();
        if (! $bot) {
            return;
        }

        $driving->loadMissing(['student', 'instructor']);
        $student = $driving->student;
        $instructor = $driving->instructor;

        if (! $student || ! $student->telegram_id) {
            return;
        }

        $dateFormatted = Carbon::parse($driving->start_time)->format('d.m.Y');
        $startTime = Carbon::parse($driving->start_time)->format('H:i');
        $endTime = Carbon::parse($driving->end_time)->format('H:i');

        $text = "❌ <b>Mashg'ulotingiz bekor qilindi</b>\n\n";
        $text .= "📅 <b>Sana:</b> {$dateFormatted}\n";
        $text .= "⏰ <b>Vaqt:</b> {$startTime} - {$endTime}\n";
        if ($instructor) {
            $text .= "👨‍🏫 <b>Instruktor:</b> {$instructor->name}\n";
        }

        try {
            $bot->sendMessage(
                text: $text,
                chat_id: $student->telegram_id,
                parse_mode: 'HTML'
            );
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram driving cancelled notification to student {$student->id}: ".$e->getMessage());
        }
    }
}
