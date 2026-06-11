package com.bjjflow.backend.posts;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class PostFlowTest {

    @Autowired
    private MockMvc mockMvc;

    private String register(String email, String beltSlug) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "senha-forte-123", "displayName": "%s",
                         "age": 30, "beltSlug": "%s", "stripes": 1}
                        """.formatted(email, email.split("@")[0], beltSlug)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private long createPost(String token, String content) throws Exception {
        var res = mockMvc.perform(post("/api/v1/gyms/posts")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\": \"%s\"}".formatted(content)))
                .andExpect(status().isOk())
                .andReturn();
        return ((Number) JsonPath.read(res.getResponse().getContentAsString(), "$.id")).longValue();
    }

    @Test
    void muralPostInteractions() throws Exception {
        String owner = register("prof@bjjflow.com", "adult-black");
        String code = JsonPath.read(mockMvc.perform(post("/api/v1/gyms")
                .header("Authorization", bearer(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "Academia Mural", "city": "São Paulo"}
                        """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), "$.inviteCode");

        String student = register("aluno@bjjflow.com", "adult-blue");
        mockMvc.perform(post("/api/v1/gyms/join")
                .header("Authorization", bearer(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"inviteCode\": \"%s\"}".formatted(code)))
                .andExpect(status().isOk());

        // students cannot post
        mockMvc.perform(post("/api/v1/gyms/posts")
                .header("Authorization", bearer(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"content": "posso postar?"}
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_STAFF"));

        long p1 = createPost(owner, "Treino forte hoje!");
        long p2 = createPost(owner, "Aviso: sem aula sexta");

        // pin the second post
        mockMvc.perform(put("/api/v1/gyms/posts/" + p2 + "/pin")
                .header("Authorization", bearer(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"pinned": true}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pinned").value(true));

        // feed: pinned post first, author is the OWNER with a black belt
        mockMvc.perform(get("/api/v1/gyms/posts").header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value((int) p2))
                .andExpect(jsonPath("$[0].pinned").value(true))
                .andExpect(jsonPath("$[0].author.role").value("OWNER"))
                .andExpect(jsonPath("$[0].author.belt.namePt").value("Preta"));

        // like toggle
        mockMvc.perform(post("/api/v1/gyms/posts/" + p1 + "/like").header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(1));
        mockMvc.perform(post("/api/v1/gyms/posts/" + p1 + "/like").header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false))
                .andExpect(jsonPath("$.likeCount").value(0));

        // comment
        mockMvc.perform(post("/api/v1/gyms/posts/" + p1 + "/comments")
                .header("Authorization", bearer(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"content": "Oss, professor!"}
                        """))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/gyms/posts/" + p1 + "/comments").header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].author.role").value("MEMBER"))
                .andExpect(jsonPath("$[0].content").value("Oss, professor!"));

        // share increments counter
        mockMvc.perform(post("/api/v1/gyms/posts/" + p1 + "/share").header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shareCount").value(1));

        // students cannot pin or delete someone else's post
        mockMvc.perform(put("/api/v1/gyms/posts/" + p1 + "/pin")
                .header("Authorization", bearer(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"pinned": true}
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_STAFF"));
        mockMvc.perform(delete("/api/v1/gyms/posts/" + p1).header("Authorization", bearer(student)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_ALLOWED"));

        // owner deletes -> feed shrinks
        mockMvc.perform(delete("/api/v1/gyms/posts/" + p1).header("Authorization", bearer(owner)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/gyms/posts").header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
