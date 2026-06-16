package com.bjjflow.backend.feed;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bjjflow.backend.auth.AuthDtos.BeltDto;
import com.bjjflow.backend.checkins.CheckIn;
import com.bjjflow.backend.checkins.CheckInRepository;
import com.bjjflow.backend.common.ApiException;
import com.bjjflow.backend.feed.CommunityFeedDtos.FeedAuthorDto;
import com.bjjflow.backend.feed.CommunityFeedDtos.FeedCommentDto;
import com.bjjflow.backend.feed.CommunityFeedDtos.FeedItemDto;
import com.bjjflow.backend.feed.CommunityFeedDtos.FeedSubmissionDto;
import com.bjjflow.backend.feed.CommunityFeedDtos.LikeResponse;
import com.bjjflow.backend.feed.CommunityFeedDtos.ShareResponse;
import com.bjjflow.backend.storage.MediaStorage;
import com.bjjflow.backend.submissions.SubmissionLog;
import com.bjjflow.backend.submissions.SubmissionLogRepository;
import com.bjjflow.backend.users.User;
import com.bjjflow.backend.users.UserBeltProgress;
import com.bjjflow.backend.users.UserBeltProgressRepository;
import com.bjjflow.backend.users.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommunityFeedService {

    private final CheckInRepository checkInRepository;
    private final UserRepository userRepository;
    private final UserBeltProgressRepository beltProgressRepository;
    private final SubmissionLogRepository submissionLogRepository;
    private final CheckInLikeRepository likeRepository;
    private final CheckInCommentRepository commentRepository;
    private final MediaStorage mediaStorage;

    @Transactional(readOnly = true)
    public List<FeedItemDto> feed(Long requesterId, int limit) {
        List<CheckIn> checkIns = checkInRepository
                .findByVisibilityOrderByCreatedAtDesc("PUBLIC", PageRequest.of(0, limit));
        if (checkIns.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = checkIns.stream().map(CheckIn::getUserId).collect(Collectors.toSet());
        Map<Long, FeedAuthorDto> authors = authorMap(userIds);

        List<Long> checkInIds = checkIns.stream().map(CheckIn::getId).toList();
        Map<Long, List<SubmissionLog>> subsByCheckIn = submissionLogRepository.findByCheckInIdIn(checkInIds).stream()
                .collect(Collectors.groupingBy(SubmissionLog::getCheckInId));
        Map<Long, Long> likeCounts = toCountMap(likeRepository.countByCheckInIds(checkInIds));
        Map<Long, Long> commentCounts = toCountMap(commentRepository.countByCheckInIds(checkInIds));
        Set<Long> liked = new HashSet<>(likeRepository.likedCheckInIds(requesterId, checkInIds));

        List<FeedItemDto> items = new ArrayList<>(checkIns.size());
        for (CheckIn c : checkIns) {
            FeedAuthorDto author = authors.get(c.getUserId());
            if (author == null) {
                continue;
            }
            List<SubmissionLog> subs = subsByCheckIn.getOrDefault(c.getId(), List.of());
            List<FeedSubmissionDto> subDtos = subs.stream()
                    .map(s -> new FeedSubmissionDto(s.getSubmission(), s.getDirection(), qty(s)))
                    .toList();

            items.add(new FeedItemDto(
                    c.getId(),
                    author,
                    c.getSessionType(),
                    c.getDurationMinutes(),
                    c.getCheckDate(),
                    c.getCreatedAt(),
                    c.getNotes(),
                    c.getPhotoKey() == null ? null : mediaStorage.urlFor(c.getPhotoKey()),
                    sumQty(subs, "HIT"),
                    sumQty(subs, "CONCEDED"),
                    subDtos,
                    likeCounts.getOrDefault(c.getId(), 0L),
                    commentCounts.getOrDefault(c.getId(), 0L),
                    c.getShareCount() == null ? 0 : c.getShareCount(),
                    liked.contains(c.getId())));
        }
        return items;
    }

    @Transactional
    public LikeResponse toggleLike(Long userId, Long checkInId) {
        CheckIn checkIn = requirePublic(checkInId);
        boolean liked;
        if (likeRepository.existsByCheckInIdAndUserId(checkIn.getId(), userId)) {
            likeRepository.deleteByCheckInIdAndUserId(checkIn.getId(), userId);
            liked = false;
        } else {
            CheckInLike like = new CheckInLike();
            like.setCheckInId(checkIn.getId());
            like.setUserId(userId);
            likeRepository.save(like);
            liked = true;
        }
        return new LikeResponse(liked, likeRepository.countByCheckInId(checkIn.getId()));
    }

    @Transactional
    public ShareResponse share(Long userId, Long checkInId) {
        CheckIn checkIn = requirePublic(checkInId);
        checkIn.setShareCount((checkIn.getShareCount() == null ? 0 : checkIn.getShareCount()) + 1);
        checkInRepository.save(checkIn);
        return new ShareResponse(checkIn.getShareCount());
    }

    @Transactional(readOnly = true)
    public List<FeedCommentDto> listComments(Long checkInId) {
        requirePublic(checkInId);
        List<CheckInComment> comments = commentRepository.findAllByCheckInIdOrderByCreatedAtAsc(checkInId);
        Map<Long, FeedAuthorDto> authors = authorMap(
                comments.stream().map(CheckInComment::getUserId).collect(Collectors.toSet()));
        return comments.stream()
                .map(c -> new FeedCommentDto(c.getId(),
                        authors.getOrDefault(c.getUserId(), fallbackAuthor(c.getUserId())),
                        c.getContent(), c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public FeedCommentDto addComment(Long userId, Long checkInId, String content) {
        requirePublic(checkInId);
        CheckInComment comment = new CheckInComment();
        comment.setCheckInId(checkInId);
        comment.setUserId(userId);
        comment.setContent(content.trim());
        comment = commentRepository.save(comment);
        FeedAuthorDto author = authorMap(Set.of(userId)).getOrDefault(userId, fallbackAuthor(userId));
        return new FeedCommentDto(comment.getId(), author, comment.getContent(), comment.getCreatedAt());
    }

    private CheckIn requirePublic(Long checkInId) {
        CheckIn c = checkInRepository.findById(checkInId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CHECKIN_NOT_FOUND", "Training not found"));
        if (!"PUBLIC".equals(c.getVisibility())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "CHECKIN_NOT_FOUND", "Training not found");
        }
        return c;
    }

    private Map<Long, FeedAuthorDto> authorMap(Collection<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, BeltDto> belts = beltProgressRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(UserBeltProgress::getUserId, CommunityFeedService::beltOf));
        Map<Long, FeedAuthorDto> out = new java.util.HashMap<>();
        for (Long id : userIds) {
            User u = users.get(id);
            if (u == null) {
                continue;
            }
            out.put(id, new FeedAuthorDto(
                    u.getId(),
                    u.getUsername(),
                    u.getDisplayName(),
                    Boolean.TRUE.equals(u.getPro()),
                    u.getAvatarKey() == null ? null : mediaStorage.urlFor(u.getAvatarKey()),
                    belts.get(id)));
        }
        return out;
    }

    private FeedAuthorDto fallbackAuthor(Long userId) {
        return new FeedAuthorDto(userId, null, "—", false, null, null);
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> out = new java.util.HashMap<>();
        for (Object[] row : rows) {
            out.put((Long) row[0], (Long) row[1]);
        }
        return out;
    }

    private static BeltDto beltOf(UserBeltProgress p) {
        var r = p.getBeltRank();
        return new BeltDto(r.getSlug(), r.getName(), r.getNamePt(), r.getColorHex(), p.getStripes());
    }

    private static int qty(SubmissionLog s) {
        return s.getQty() == null ? 0 : s.getQty();
    }

    private static int sumQty(List<SubmissionLog> subs, String direction) {
        return subs.stream().filter(s -> direction.equals(s.getDirection())).mapToInt(CommunityFeedService::qty).sum();
    }
}
