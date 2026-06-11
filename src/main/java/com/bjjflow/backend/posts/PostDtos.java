package com.bjjflow.backend.posts;

import java.time.Instant;

import com.bjjflow.backend.gyms.GymDtos.BeltSummary;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PostDtos {

    public record AuthorDto(Long userId, String displayName, String role, BeltSummary belt) {
    }

    public record PostDto(
            Long id,
            AuthorDto author,
            String content,
            boolean pinned,
            long likeCount,
            long commentCount,
            int shareCount,
            boolean likedByMe,
            Instant createdAt) {
    }

    public record CommentDto(Long id, AuthorDto author, String content, Instant createdAt) {
    }

    public record CreatePostRequest(@NotBlank @Size(max = 2000) String content) {
    }

    public record CreateCommentRequest(@NotBlank @Size(max = 1000) String content) {
    }

    public record PinRequest(boolean pinned) {
    }

    public record LikeResponse(boolean liked, long likeCount) {
    }

    public record ShareResponse(int shareCount) {
    }
}
