package com.bjjflow.backend.users;

import java.time.Instant;
import java.util.List;

import com.bjjflow.backend.auth.AuthDtos.BeltDto;
import com.bjjflow.backend.gyms.GymDtos.GymPhotoDto;
import com.bjjflow.backend.gyms.GymDtos.MedalDto;

import jakarta.validation.constraints.Size;

public class ProfileDtos {

    public record MetricsDto(long trainings, int currentStreak, int longestStreak, long activeWeeks) {
    }

    public record GymSummaryDto(
            Long id,
            String name,
            String city,
            boolean verified,
            String role,
            String logoUrl,
            long memberCount,
            double ratingAverage,
            long ratingCount) {
    }

    public record UserProfileDto(
            Long id,
            String displayName,
            boolean pro,
            String bio,
            String city,
            String avatarUrl,
            String certificateUrl,
            String accentColor,
            Instant joinedAt,
            BeltDto belt,
            GymSummaryDto gym,
            MetricsDto metrics,
            List<MedalDto> medals,
            List<GymPhotoDto> photos,
            long followers,
            long following,
            boolean isFollowing,
            boolean isMe) {
    }

    public record UpdateProfileRequest(
            @Size(max = 500) String bio,
            @Size(max = 300) String avatarKey,
            @Size(max = 300) String certificateKey,
            @Size(max = 9) String accentColor) {
    }
}
