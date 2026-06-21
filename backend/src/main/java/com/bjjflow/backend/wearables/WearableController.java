package com.bjjflow.backend.wearables;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bjjflow.backend.wearables.WearableDtos.BiometricDto;
import com.bjjflow.backend.wearables.WearableDtos.ConnectDto;
import com.bjjflow.backend.wearables.WearableDtos.IngestRequest;
import com.bjjflow.backend.wearables.WearableDtos.ProviderDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WearableController {

    private final WearableService wearableService;

    private static Long userId(Authentication auth) {
        return Long.parseLong(auth.getName());
    }

    @GetMapping("/wearables/providers")
    public List<ProviderDto> providers(Authentication auth) {
        return wearableService.providers(userId(auth));
    }

    @PostMapping("/wearables/{provider}/connect")
    public ConnectDto connect(Authentication auth, @PathVariable String provider) {
        return wearableService.connect(userId(auth), provider);
    }

    @PostMapping("/wearables/{provider}/disconnect")
    public ResponseEntity<Void> disconnect(Authentication auth, @PathVariable String provider) {
        wearableService.disconnect(userId(auth), provider);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/biometrics")
    public List<BiometricDto> biometrics(Authentication auth) {
        return wearableService.summary(userId(auth));
    }

    @PostMapping("/users/me/biometrics")
    public List<BiometricDto> ingest(Authentication auth, @Valid @RequestBody IngestRequest req) {
        return wearableService.ingest(userId(auth), req);
    }
}
