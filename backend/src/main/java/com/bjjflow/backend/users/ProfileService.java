package com.bjjflow.backend.users;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bjjflow.backend.auth.AuthDtos.BeltDto;
import com.bjjflow.backend.checkins.CheckInRepository;
import com.bjjflow.backend.common.ApiException;
import com.bjjflow.backend.gyms.Gym;
import com.bjjflow.backend.gyms.GymDtos.GymPhotoDto;
import com.bjjflow.backend.gyms.GymDtos.MedalDto;
import com.bjjflow.backend.gyms.GymDtos.MedalInput;
import com.bjjflow.backend.gyms.GymMemberRepository;
import com.bjjflow.backend.gyms.GymRepository;
import com.bjjflow.backend.gyms.GymReview;
import com.bjjflow.backend.gyms.GymReviewRepository;
import com.bjjflow.backend.social.Follow;
import com.bjjflow.backend.social.FollowRepository;
import com.bjjflow.backend.users.ProfileDtos.GymSummaryDto;
import com.bjjflow.backend.users.ProfileDtos.MetricsDto;
import com.bjjflow.backend.users.ProfileDtos.UpdateProfileRequest;
import com.bjjflow.backend.users.ProfileDtos.UserProfileDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final Set<String> MEDAL_TIERS = Set.of("GOLD", "SILVER", "BRONZE");

    private final UserRepository userRepository;
    private final UserBeltProgressRepository beltProgressRepository;
    private final UserMedalRepository userMedalRepository;
    private final UserPhotoRepository userPhotoRepository;
    private final FollowRepository followRepository;
    private final GymMemberRepository gymMemberRepository;
    private final GymRepository gymRepository;
    private final GymReviewRepository gymReviewRepository;
    private final CheckInRepository checkInRepository;
    private final com.bjjflow.backend.storage.MediaStorage mediaStorage;

    @Transactional(readOnly = true)
    public UserProfileDto profile(Long viewerId, Long targetId) {
        User user = requireUser(targetId);

        BeltDto belt = beltProgressRepository.findByUserId(targetId)
                .map(p -> {
                    var r = p.getBeltRank();
                    return new BeltDto(r.getSlug(), r.getName(), r.getNamePt(), r.getColorHex(), p.getStripes());
                })
                .orElse(null);

        GymSummaryDto gym = gymMemberRepository.findFirstByUserId(targetId)
                .map(m -> gymRepository.findById(m.getGymId())
                        .map(g -> gymSummary(g, m.getRole().name()))
                        .orElse(null))
                .orElse(null);

        List<MedalDto> medals = userMedalRepository.findAllByUserIdOrderByPositionAsc(targetId).stream()
                .map(m -> new MedalDto(m.getId(), m.getCompetition(), m.getTier(), m.getCount() == null ? 1 : m.getCount()))
                .toList();

        List<GymPhotoDto> photos = userPhotoRepository.findAllByUserIdOrderByPositionAsc(targetId).stream()
                .map(ph -> new GymPhotoDto(ph.getId(), mediaStorage.urlFor(ph.getStorageKey())))
                .toList();

        return new UserProfileDto(
                user.getId(),
                user.getDisplayName(),
                Boolean.TRUE.equals(user.getPro()),
                user.getBio(),
                user.getCity(),
                user.getAvatarKey() == null ? null : mediaStorage.urlFor(user.getAvatarKey()),
                user.getCertificateKey() == null ? null : mediaStorage.urlFor(user.getCertificateKey()),
                user.getAccentColor(),
                user.getCreatedAt(),
                belt,
                gym,
                metrics(user),
                medals,
                photos,
                followRepository.countByFollowingId(targetId),
                followRepository.countByFollowerId(targetId),
                !viewerId.equals(targetId) && followRepository.existsByFollowerIdAndFollowingId(viewerId, targetId),
                viewerId.equals(targetId));
    }

    private GymSummaryDto gymSummary(com.bjjflow.backend.gyms.Gym g, String role) {
        List<GymReview> reviews = gymReviewRepository.findAllByGymIdOrderByCreatedAtDesc(g.getId());
        long ratingCount = reviews.size();
        double ratingAverage = ratingCount == 0 ? 0 : reviews.stream().mapToInt(GymReview::getRating).average().orElse(0);
        return new GymSummaryDto(
                g.getId(),
                g.getName(),
                g.getCity(),
                Boolean.TRUE.equals(g.getVerified()),
                role,
                g.getLogoKey() == null ? null : mediaStorage.urlFor(g.getLogoKey()),
                gymMemberRepository.countByGymId(g.getId()),
                ratingAverage,
                ratingCount);
    }

    private MetricsDto metrics(User user) {
        LocalDate last = user.getLastCheckInDate();
        boolean alive = last != null && !last.isBefore(LocalDate.now().minusDays(1));
        long activeWeeks = checkInRepository.distinctCheckDates(user.getId()).stream()
                .map(d -> d.get(IsoFields.WEEK_BASED_YEAR) * 100 + d.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR))
                .distinct()
                .count();
        return new MetricsDto(
                checkInRepository.countByUserId(user.getId()),
                alive ? user.getCurrentStreak() : 0,
                user.getLongestStreak(),
                activeWeeks);
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest req) {
        User u = requireUser(userId);
        u.setBio(blankToNull(req.bio()));
        if (req.avatarKey() != null && !req.avatarKey().isBlank()) {
            u.setAvatarKey(req.avatarKey());
        }
        if (req.certificateKey() != null && !req.certificateKey().isBlank()) {
            u.setCertificateKey(req.certificateKey());
        }
        if (req.accentColor() != null && !req.accentColor().isBlank()) {
            u.setAccentColor(req.accentColor().trim());
        }
        userRepository.save(u);
        return profile(userId, userId);
    }

    @Transactional
    public UserProfileDto addPhoto(Long userId, String key) {
        UserPhoto photo = new UserPhoto();
        photo.setUserId(userId);
        photo.setStorageKey(key);
        photo.setPosition((int) userPhotoRepository.countByUserId(userId));
        userPhotoRepository.save(photo);
        return profile(userId, userId);
    }

    @Transactional
    public UserProfileDto deletePhoto(Long userId, Long photoId) {
        userPhotoRepository.findByIdAndUserId(photoId, userId).ifPresent(userPhotoRepository::delete);
        return profile(userId, userId);
    }

    @Transactional
    public UserProfileDto replaceMedals(Long userId, List<MedalInput> medals) {
        userMedalRepository.deleteByUserId(userId);
        int position = 0;
        for (MedalInput m : medals == null ? List.<MedalInput>of() : medals) {
            String tier = m.tier() == null ? "" : m.tier().trim().toUpperCase(Locale.ROOT);
            if (!MEDAL_TIERS.contains(tier)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TIER", "Medal tier must be GOLD, SILVER or BRONZE");
            }
            UserMedal um = new UserMedal();
            um.setUserId(userId);
            um.setCompetition(m.competition().trim());
            um.setTier(tier);
            um.setCount(m.count());
            um.setPosition(position++);
            userMedalRepository.save(um);
        }
        return profile(userId, userId);
    }

    @Transactional
    public UserProfileDto follow(Long viewerId, Long targetId) {
        if (viewerId.equals(targetId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_FOLLOW_SELF", "You cannot follow yourself");
        }
        requireUser(targetId);
        if (!followRepository.existsByFollowerIdAndFollowingId(viewerId, targetId)) {
            Follow f = new Follow();
            f.setFollowerId(viewerId);
            f.setFollowingId(targetId);
            followRepository.save(f);
        }
        return profile(viewerId, targetId);
    }

    @Transactional
    public UserProfileDto unfollow(Long viewerId, Long targetId) {
        followRepository.findByFollowerIdAndFollowingId(viewerId, targetId).ifPresent(followRepository::delete);
        return profile(viewerId, targetId);
    }

    // TEMP testing aid: flips PRO so the badge can be previewed before the
    // subscription system exists (mirrors the gym /verify toggle).
    @Transactional
    public UserProfileDto togglePro(Long userId) {
        User u = requireUser(userId);
        u.setPro(!Boolean.TRUE.equals(u.getPro()));
        userRepository.save(u);
        return profile(userId, userId);
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
    }

    private String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
