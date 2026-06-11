package com.bjjflow.backend.gyms;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bjjflow.backend.common.ApiException;
import com.bjjflow.backend.users.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/gyms")
@RequiredArgsConstructor
public class GymController {

    private static final int MAX_SUGGESTIONS = 10;

    private final GymRepository gymRepository;
    private final GymMemberRepository gymMemberRepository;
    private final UserRepository userRepository;

    public record GymDto(Long id, String name, String city, long memberCount, boolean joined) {
    }

    @GetMapping("/suggestions")
    public List<GymDto> suggestions(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        String city = userRepository.findById(userId).map(u -> u.getCity()).orElse(null);

        Set<Long> joinedIds = gymMemberRepository.findAllByUserId(userId).stream()
                .map(GymMember::getGymId)
                .collect(Collectors.toSet());

        // Por enquanto a proximidade é por cidade; geolocalização chega no Phase 2.
        List<Gym> gyms = city == null || city.isBlank()
                ? gymRepository.findAll()
                : gymRepository.findAllByCityIgnoreCase(city);
        if (gyms.isEmpty()) {
            gyms = gymRepository.findAll();
        }

        return gyms.stream()
                .filter(g -> !joinedIds.contains(g.getId()))
                .map(g -> new GymDto(g.getId(), g.getName(), g.getCity(),
                        gymMemberRepository.countByGymId(g.getId()), false))
                .sorted(Comparator.comparingLong(GymDto::memberCount).reversed())
                .limit(MAX_SUGGESTIONS)
                .toList();
    }

    @PostMapping("/{id}/join")
    public GymDto join(Authentication auth, @PathVariable Long id) {
        Long userId = Long.parseLong(auth.getName());
        Gym gym = gymRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "GYM_NOT_FOUND", "Gym not found"));

        if (gymMemberRepository.findByGymIdAndUserId(id, userId).isEmpty()) {
            GymMember member = new GymMember();
            member.setGymId(id);
            member.setUserId(userId);
            gymMemberRepository.save(member);
        }
        return new GymDto(gym.getId(), gym.getName(), gym.getCity(),
                gymMemberRepository.countByGymId(id), true);
    }
}
