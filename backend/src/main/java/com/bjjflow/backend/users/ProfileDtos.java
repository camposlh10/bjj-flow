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

    /** Compact user card for people-search results. */
    public record SearchUserDto(Long id, String username, String displayName, String avatarUrl, boolean pro,
            BeltDto belt) {
    }

    public record SettingsDto(String email, String username, boolean pro, boolean privateAccount,
            boolean notifyCommunity, boolean notifyMessages, boolean notifyPromotions, boolean mfaEnabled) {
    }

    public record UpdateSettingsRequest(Boolean privateAccount, Boolean notifyCommunity, Boolean notifyMessages,
            Boolean notifyPromotions) {
    }

    public record ChangePasswordRequest(
            @jakarta.validation.constraints.NotBlank String currentPassword,
            @jakarta.validation.constraints.NotBlank @Size(min = 8, max = 72) String newPassword) {
    }

    public record ChangeEmailRequest(
            @jakarta.validation.constraints.NotBlank String password,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email String email) {
    }

    public record FeedbackRequest(@jakarta.validation.constraints.NotBlank @Size(max = 2000) String message) {
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
            String username,
            String displayName,
            boolean pro,
            String bio,
            String city,
            String avatarUrl,
            String certificateUrl,
            String accentColor,
            String bannerUrl,
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
            @Size(max = 9) String accentColor,
            @Size(max = 300) String bannerKey,
            @Size(max = 30) String username) {
    }
}
