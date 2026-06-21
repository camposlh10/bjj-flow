package com.bjjflow.backend.wearables;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.transaction.annotation.Transactional
class WearableFlowTest {

    @Autowired
    private MockMvc mockMvc;

    private String register(String email) throws Exception {
        String json = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "senha-forte-123", "displayName": "%s",
                         "age": 26, "beltSlug": "adult-blue", "stripes": 0, "weightKg": 80.0}
                        """.formatted(email, email.split("@")[0])))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.accessToken");
    }

    private String auth(String t) {
        return "Bearer " + t;
    }

    @Test
    void providersConnectIngestAndUnlock() throws Exception {
        String tok = register("wear1@bjjflow.com");
        String today = LocalDate.now().toString();

        // 4 providers; Apple Health is on-device (configured), cloud ones aren't (no keys)
        mockMvc.perform(get("/api/v1/wearables/providers").header("Authorization", auth(tok)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[?(@.provider == 'APPLE_HEALTH')].configured")
                        .value(org.hamcrest.Matchers.hasItem(true)))
                .andExpect(jsonPath("$[?(@.provider == 'WHOOP')].configured")
                        .value(org.hamcrest.Matchers.hasItem(false)));

        // Cloud provider without keys -> honest 503
        mockMvc.perform(post("/api/v1/wearables/WHOOP/connect").header("Authorization", auth(tok)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("PROVIDER_NOT_CONFIGURED"));

        // Apple Health connects on-device
        mockMvc.perform(post("/api/v1/wearables/APPLE_HEALTH/connect").header("Authorization", auth(tok)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONNECTED"));

        // No samples yet -> no unlocked tiles
        mockMvc.perform(get("/api/v1/users/me/biometrics").header("Authorization", auth(tok)))
                .andExpect(jsonPath("$.length()").value(0));

        // Push readings -> tiles unlock
        mockMvc.perform(post("/api/v1/users/me/biometrics").header("Authorization", auth(tok))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"provider": "APPLE_HEALTH", "samples": [
                          {"metric": "RECOVERY", "date": "%s", "value": 72},
                          {"metric": "SLEEP", "date": "%s", "value": 7.5, "unit": "h"},
                          {"metric": "RESTING_HR", "date": "%s", "value": 54}
                        ]}
                        """.formatted(today, today, today)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[?(@.metric == 'RECOVERY')].label")
                        .value(org.hamcrest.Matchers.hasItem("Recuperação")));

        // Unknown metric rejected
        mockMvc.perform(post("/api/v1/users/me/biometrics").header("Authorization", auth(tok))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"provider\": \"APPLE_HEALTH\", \"samples\": [{\"metric\": \"BOGUS\", \"date\": \"%s\", \"value\": 1}]}"
                        .formatted(today)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_METRIC"));

        // Disconnect clears that provider's samples -> tiles re-lock
        mockMvc.perform(post("/api/v1/wearables/APPLE_HEALTH/disconnect").header("Authorization", auth(tok)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/users/me/biometrics").header("Authorization", auth(tok)))
                .andExpect(jsonPath("$.length()").value(0));
    }
}
