<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $driving_id
 * @property int $rating
 * @property array|null $reason_tags
 * @property string|null $comment
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property-read Driving $driving
 */
#[Fillable(['driving_id', 'rating', 'reason_tags', 'comment'])]
class Review extends Model
{
    /** @use HasFactory<\Database\Factories\ReviewFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'reason_tags' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Driving, $this>
     */
    public function driving(): BelongsTo
    {
        return $this->belongsTo(Driving::class);
    }
}
