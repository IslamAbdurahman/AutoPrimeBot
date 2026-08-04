<?php

namespace App\Services;

use App\Models\Driving;
use SergiX44\Nutgram\Nutgram;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardMarkup;

class TelegramService
{
    /**
     * Send a lesson rating prompt to the student.
     */
    public function sendLessonRatingPrompt(Driving $driving, Nutgram $bot): void
    {
        $student = $driving->student;
        $instructor = $driving->instructor;
        
        if (!$student || !$student->telegram_id) {
            return;
        }

        $text = "Mashg'ulotingiz tugadi!\n\n";
        $text .= "Instruktor: {$instructor->name}\n";
        $text .= "Iltimos, mashg'ulotni baholang (1-5):";

        $keyboard = InlineKeyboardMarkup::make();
        for ($i = 1; $i <= 5; $i++) {
            $keyboard->addRow(
                InlineKeyboardButton::make(str_repeat('⭐', $i), callback_data: "rate:{$driving->id}:{$i}")
            );
        }

        $bot->sendMessage($text, [
            'chat_id' => $student->telegram_id,
            'reply_markup' => $keyboard,
        ]);
    }
}
