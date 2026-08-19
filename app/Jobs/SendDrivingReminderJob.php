<?php

namespace App\Jobs;

use App\Models\Driving;
use App\Services\TelegramService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendDrivingReminderJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 5;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Driving $driving,
        public string $type // '24h' or '2h'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TelegramService $telegramService): void
    {
        // Refresh to get latest status in case it was cancelled/completed while in queue
        $this->driving->refresh();

        if ($this->driving->status !== 'scheduled') {
            return;
        }

        if ($this->type === '24h') {
            if ($this->driving->reminded_24h_at !== null) {
                return;
            }
            $telegramService->sendDriving24hReminder($this->driving);
            $this->driving->update(['reminded_24h_at' => now()]);
        } elseif ($this->type === '2h') {
            if ($this->driving->reminded_2h_at !== null) {
                return;
            }
            $telegramService->sendDriving2hReminder($this->driving);
            $this->driving->update(['reminded_2h_at' => now()]);
        }
    }
}
