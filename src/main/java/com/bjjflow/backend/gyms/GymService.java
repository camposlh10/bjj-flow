package com.bjjflow.backend.gyms;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bjjflow.backend.common.ApiException;
import com.bjjflow.backend.gyms.GymDtos.BeltSummary;
import com.bjjflow.backend.gyms.GymDtos.GymDto;
import com.bjjflow.backend.gyms.GymDtos.GymSuggestionDto;
import com.bjjflow.backend.gyms.GymDtos.MemberDto;
import com.bjjflow.backend.users.User;
import com.bjjflow.backend.users.UserBeltProgress;
import com.bjjflow.backend.users.UserBeltProgressRepository;
import com.bjjflow.backend.users.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GymService {

    private static final int MAX_SUGGESTIONS = 10;
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final GymRepository gymRepository;
    private final GymMemberRepository gymMemberRepository;
    private final UserRepository userRepository;
    private final UserBeltProgressRepository beltProgressRepository;

    @Transactional
    public GymDto createGym(Long userId, String name, String city, String description) {
        requireNoGym(userId);

        Gym gym = new Gym();
        gym.setName(name.trim());
        gym.setCity(city == null || city.isBlank() ? null : city.trim());
        gym.setDescription(description == null || description.isBlank() ? null : description.trim());
        gym.setGraduationTarget(40);
        gym.setInviteCode(generateUniqueCode());
        gym = gymRepository.save(gym);

        addMember(gym.getId(), userId, GymRole.OWNER);
        return toGymDto(gym, GymRole.OWNER);
    }

    @Transactional
    public GymDto joinByCode(Long userId, String inviteCode) {
        requireNoGym(userId);
        Gym gym = gymRepository.findByInviteCode(inviteCode.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVALID_INVITE_CODE",
                        "No gym matches this invite code"));
        addMember(gym.getId(), userId, GymRole.MEMBER);
        return toGymDto(gym, GymRole.MEMBER);
    }

    @Transactional
    public void leaveGym(Long userId) {
        GymMember member = gymMemberRepository.findFirstByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NO_GYM", "You are not in a gym"));
        gymMemberRepository.delete(member);
    }

    // TEMP testing aid: lets a user flip their own role to exercise member vs
    // instructor/owner features with a single account. Remove (or gate behind a
    // dev profile) before production — real promotions go through an owner.
    @Transactional
    public GymDto setMyRole(Long userId, String roleName) {
        GymMember member = gymMemberRepository.findFirstByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NO_GYM", "You are not in a gym"));
        GymRole role;
        try {
            role = GymRole.valueOf(roleName.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Unknown role");
        }
        member.setRole(role);
        gymMemberRepository.save(member);
        Gym gym = gymRepository.findById(member.getGymId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "GYM_NOT_FOUND", "Gym not found"));
        return toGymDto(gym, role);
    }

    @Transactional(readOnly = true)
    public Optional<GymDto> getMyGym(Long userId) {
        return gymMemberRepository.findFirstByUserId(userId)
                .flatMap(m -> gymRepository.findById(m.getGymId())
                        .map(gym -> toGymDto(gym, m.getRole())));
    }

    @Transactional(readOnly = true)
    public List<MemberDto> listMembers(Long userId) {
        GymMember mine = gymMemberRepository.findFirstByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NO_GYM", "You are not in a gym"));

        return gymMemberRepository.findAllByGymId(mine.getGymId()).stream()
                .map(this::toMemberDto)
                .sorted(Comparator
                        .comparingInt((MemberDto m) -> rolePriority(m.role()))
                        .thenComparing(MemberDto::displayName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GymSuggestionDto> suggestions(Long userId) {
        // One primary gym: once you're in one, we stop suggesting others.
        if (gymMemberRepository.findFirstByUserId(userId).isPresent()) {
            return List.of();
        }
        String city = userRepository.findById(userId).map(User::getCity).orElse(null);
        List<Gym> gyms = city == null || city.isBlank()
                ? gymRepository.findAll()
                : gymRepository.findAllByCityIgnoreCase(city);
        if (gyms.isEmpty()) {
            gyms = gymRepository.findAll();
        }
        return gyms.stream()
                .map(g -> new GymSuggestionDto(g.getId(), g.getName(), g.getCity(),
                        gymMemberRepository.countByGymId(g.getId())))
                .sorted(Comparator.comparingLong(GymSuggestionDto::memberCount).reversed())
                .limit(MAX_SUGGESTIONS)
                .toList();
    }

    private void requireNoGym(Long userId) {
        if (gymMemberRepository.findFirstByUserId(userId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_IN_GYM", "You already belong to a gym");
        }
    }

    private void addMember(Long gymId, Long userId, GymRole role) {
        GymMember member = new GymMember();
        member.setGymId(gymId);
        member.setUserId(userId);
        member.setRole(role);
        gymMemberRepository.save(member);
    }

    private GymDto toGymDto(Gym gym, GymRole role) {
        boolean staff = role == GymRole.OWNER || role == GymRole.INSTRUCTOR;
        return new GymDto(
                gym.getId(),
                gym.getName(),
                gym.getCity(),
                gym.getDescription(),
                gymMemberRepository.countByGymId(gym.getId()),
                role.name(),
                gym.getGraduationTarget(),
                staff ? gym.getInviteCode() : null);
    }

    private MemberDto toMemberDto(GymMember member) {
        String displayName = userRepository.findById(member.getUserId())
                .map(User::getDisplayName)
                .orElse("—");
        BeltSummary belt = beltProgressRepository.findByUserId(member.getUserId())
                .map(this::toBeltSummary)
                .orElse(null);
        return new MemberDto(member.getUserId(), displayName, member.getRole().name(), belt);
    }

    private BeltSummary toBeltSummary(UserBeltProgress progress) {
        var rank = progress.getBeltRank();
        return new BeltSummary(rank.getSlug(), rank.getNamePt(), rank.getColorHex(), progress.getStripes());
    }

    private int rolePriority(String role) {
        return switch (role) {
            case "OWNER" -> 0;
            case "INSTRUCTOR" -> 1;
            default -> 2;
        };
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 25; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (gymRepository.findByInviteCode(code).isEmpty()) {
                return code;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "CODE_GEN_FAILED",
                "Could not generate a unique invite code");
    }
}
