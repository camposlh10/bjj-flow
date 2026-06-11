package com.bjjflow.backend.posts;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bjjflow.backend.common.ApiException;
import com.bjjflow.backend.gyms.GymDtos.BeltSummary;
import com.bjjflow.backend.gyms.GymMember;
import com.bjjflow.backend.gyms.GymMemberRepository;
import com.bjjflow.backend.gyms.GymRole;
import com.bjjflow.backend.posts.PostDtos.AuthorDto;
import com.bjjflow.backend.posts.PostDtos.CommentDto;
import com.bjjflow.backend.posts.PostDtos.LikeResponse;
import com.bjjflow.backend.posts.PostDtos.PostDto;
import com.bjjflow.backend.posts.PostDtos.ShareResponse;
import com.bjjflow.backend.users.User;
import com.bjjflow.backend.users.UserBeltProgress;
import com.bjjflow.backend.users.UserBeltProgressRepository;
import com.bjjflow.backend.users.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final GymPostRepository postRepository;
    private final GymPostLikeRepository likeRepository;
    private final GymPostCommentRepository commentRepository;
    private final GymMemberRepository gymMemberRepository;
    private final UserRepository userRepository;
    private final UserBeltProgressRepository beltProgressRepository;

    @Transactional
    public PostDto createPost(Long userId, String content) {
        GymMember membership = requireMembership(userId);
        requireStaff(membership);

        GymPost post = new GymPost();
        post.setGymId(membership.getGymId());
        post.setAuthorUserId(userId);
        post.setContent(content.trim());
        post = postRepository.save(post);
        return toPostDto(post, userId);
    }

    @Transactional(readOnly = true)
    public List<PostDto> feed(Long userId) {
        GymMember membership = requireMembership(userId);
        return postRepository.findAllByGymIdOrderByPinnedDescCreatedAtDesc(membership.getGymId()).stream()
                .map(p -> toPostDto(p, userId))
                .toList();
    }

    @Transactional
    public LikeResponse toggleLike(Long userId, Long postId) {
        GymMember membership = requireMembership(userId);
        GymPost post = postInGym(postId, membership.getGymId());
        boolean liked;
        if (likeRepository.existsByPostIdAndUserId(post.getId(), userId)) {
            likeRepository.deleteByPostIdAndUserId(post.getId(), userId);
            liked = false;
        } else {
            GymPostLike like = new GymPostLike();
            like.setPostId(post.getId());
            like.setUserId(userId);
            likeRepository.save(like);
            liked = true;
        }
        return new LikeResponse(liked, likeRepository.countByPostId(post.getId()));
    }

    @Transactional
    public ShareResponse share(Long userId, Long postId) {
        GymMember membership = requireMembership(userId);
        GymPost post = postInGym(postId, membership.getGymId());
        post.setShareCount(post.getShareCount() + 1);
        postRepository.save(post);
        return new ShareResponse(post.getShareCount());
    }

    @Transactional
    public CommentDto addComment(Long userId, Long postId, String content) {
        GymMember membership = requireMembership(userId);
        GymPost post = postInGym(postId, membership.getGymId());
        GymPostComment comment = new GymPostComment();
        comment.setPostId(post.getId());
        comment.setUserId(userId);
        comment.setContent(content.trim());
        comment = commentRepository.save(comment);
        return new CommentDto(comment.getId(), authorDto(userId, membership.getGymId()),
                comment.getContent(), comment.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<CommentDto> listComments(Long userId, Long postId) {
        GymMember membership = requireMembership(userId);
        GymPost post = postInGym(postId, membership.getGymId());
        return commentRepository.findAllByPostIdOrderByCreatedAtAsc(post.getId()).stream()
                .map(c -> new CommentDto(c.getId(), authorDto(c.getUserId(), membership.getGymId()),
                        c.getContent(), c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public PostDto setPinned(Long userId, Long postId, boolean pinned) {
        GymMember membership = requireMembership(userId);
        requireStaff(membership);
        GymPost post = postInGym(postId, membership.getGymId());
        post.setPinned(pinned);
        postRepository.save(post);
        return toPostDto(post, userId);
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        GymMember membership = requireMembership(userId);
        GymPost post = postInGym(postId, membership.getGymId());
        boolean isAuthor = post.getAuthorUserId().equals(userId);
        boolean isOwner = membership.getRole() == GymRole.OWNER;
        if (!isAuthor && !isOwner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_ALLOWED",
                    "Only the author or the gym owner can delete this post");
        }
        commentRepository.deleteByPostId(post.getId());
        likeRepository.deleteByPostId(post.getId());
        postRepository.delete(post);
    }

    private GymMember requireMembership(Long userId) {
        return gymMemberRepository.findFirstByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NO_GYM", "You are not in a gym"));
    }

    private void requireStaff(GymMember membership) {
        if (membership.getRole() == GymRole.MEMBER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_STAFF",
                    "Only instructors can do this");
        }
    }

    private GymPost postInGym(Long postId, Long gymId) {
        GymPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Post not found"));
        if (!post.getGymId().equals(gymId)) {
            // Don't reveal posts from other gyms
            throw new ApiException(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", "Post not found");
        }
        return post;
    }

    private PostDto toPostDto(GymPost post, Long requesterId) {
        return new PostDto(
                post.getId(),
                authorDto(post.getAuthorUserId(), post.getGymId()),
                post.getContent(),
                Boolean.TRUE.equals(post.getPinned()),
                likeRepository.countByPostId(post.getId()),
                commentRepository.countByPostId(post.getId()),
                post.getShareCount(),
                likeRepository.existsByPostIdAndUserId(post.getId(), requesterId),
                post.getCreatedAt());
    }

    private AuthorDto authorDto(Long userId, Long gymId) {
        String displayName = userRepository.findById(userId).map(User::getDisplayName).orElse("—");
        String role = gymMemberRepository.findByGymIdAndUserId(gymId, userId)
                .map(m -> m.getRole().name())
                .orElse(GymRole.MEMBER.name());
        BeltSummary belt = beltProgressRepository.findByUserId(userId)
                .map(this::toBeltSummary)
                .orElse(null);
        return new AuthorDto(userId, displayName, role, belt);
    }

    private BeltSummary toBeltSummary(UserBeltProgress progress) {
        var rank = progress.getBeltRank();
        return new BeltSummary(rank.getSlug(), rank.getNamePt(), rank.getColorHex(), progress.getStripes());
    }
}
