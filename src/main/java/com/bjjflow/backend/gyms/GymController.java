package com.bjjflow.backend.gyms;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bjjflow.backend.gyms.GymDtos.CreateGymRequest;
import com.bjjflow.backend.gyms.GymDtos.GymDto;
import com.bjjflow.backend.gyms.GymDtos.GymSuggestionDto;
import com.bjjflow.backend.gyms.GymDtos.JoinGymRequest;
import com.bjjflow.backend.gyms.GymDtos.MemberDto;
import com.bjjflow.backend.gyms.GymDtos.SetRoleRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/gyms")
@RequiredArgsConstructor
public class GymController {

    private final GymService gymService;

    private static Long userId(Authentication auth) {
        return Long.parseLong(auth.getName());
    }

    @PostMapping
    public GymDto create(Authentication auth, @Valid @RequestBody CreateGymRequest request) {
        return gymService.createGym(userId(auth), request.name(), request.city(), request.description());
    }

    @PostMapping("/join")
    public GymDto join(Authentication auth, @Valid @RequestBody JoinGymRequest request) {
        return gymService.joinByCode(userId(auth), request.inviteCode());
    }

    @PostMapping("/leave")
    public ResponseEntity<Void> leave(Authentication auth) {
        gymService.leaveGym(userId(auth));
        return ResponseEntity.noContent().build();
    }

    // TEMP testing aid — see GymService.setMyRole
    @PostMapping("/me/role")
    public GymDto setRole(Authentication auth, @Valid @RequestBody SetRoleRequest request) {
        return gymService.setMyRole(userId(auth), request.role());
    }

    @GetMapping("/me")
    public ResponseEntity<GymDto> myGym(Authentication auth) {
        return gymService.getMyGym(userId(auth))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/me/members")
    public List<MemberDto> members(Authentication auth) {
        return gymService.listMembers(userId(auth));
    }

    @GetMapping("/suggestions")
    public List<GymSuggestionDto> suggestions(Authentication auth) {
        return gymService.suggestions(userId(auth));
    }
}
