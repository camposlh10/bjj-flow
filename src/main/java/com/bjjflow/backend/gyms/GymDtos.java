package com.bjjflow.backend.gyms;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GymDtos {

    public record CreateGymRequest(
            @NotBlank @Size(max = 150) String name,
            @Size(max = 100) String city,
            @Size(max = 500) String description) {
    }

    public record JoinGymRequest(@NotBlank @Size(max = 12) String inviteCode) {
    }

    public record SetRoleRequest(@NotBlank String role) {
    }

    public record BeltSummary(String slug, String namePt, String colorHex, int stripes) {
    }

    public record GymDto(
            Long id,
            String name,
            String city,
            String description,
            long memberCount,
            String role,
            Integer graduationTarget,
            /** only present for owner/instructor, so staff can share it */
            String inviteCode) {
    }

    public record MemberDto(Long userId, String displayName, String role, BeltSummary belt,
            /** verified class attendances since the last promotion (graduation counter) */
            long classesAttended) {
    }

    public record PromoteRequest(
            @NotBlank String beltSlug,
            @jakarta.validation.constraints.Min(0) @jakarta.validation.constraints.Max(6) Integer stripes) {
    }

    public record GymSuggestionDto(Long id, String name, String city, long memberCount) {
    }

    public record MembersResponse(List<MemberDto> members) {
    }
}
