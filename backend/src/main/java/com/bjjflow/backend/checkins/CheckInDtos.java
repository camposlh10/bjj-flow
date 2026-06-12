package com.bjjflow.backend.checkins;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CheckInDtos {

    public record CreateCheckInRequest(
            @NotNull LocalDate date,
            @Size(max = 20) String sessionType,
            @Min(5) @Max(600) Integer durationMinutes,
            @Size(max = 500) String notes) {
    }

    public record CheckInDto(Long id, LocalDate date, String sessionType, Integer durationMinutes, String notes) {
    }

    public record StatsResponse(
            int currentStreak,
            int longestStreak,
            long totalCheckIns,
            long totalHours,
            int weeklyGoal,
            int weeklyProgress,
            boolean checkedInToday,
            List<Boolean> weekDays) {
    }
}
