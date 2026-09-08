package com.example.logis.services;

import com.example.logis.data.enums.CompanyRole;
import com.example.logis.data.entities.User;
import com.example.logis.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    // jjwt requires HMAC keys of at least 32 bytes (256 bits)
    private static final String SECRET = "unit-test-secret-key-that-is-32+chars!";
    private static final long EXPIRATION_MS = 3_600_000;

    private final JwtService jwtService = new JwtService(SECRET, EXPIRATION_MS);

    // User ids are @GeneratedValue and have no setter, so tests assign them via reflection.
    private static User user(Long id, CompanyRole role) {
        User user = new User("John", "Doe", "johndoe", "john@acme.com", "password-hash", role);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    @Test
    void generateToken_embedsEmailUserIdAndRole() {
        String token = jwtService.generateToken(user(7L, CompanyRole.MANAGER));

        assertThat(jwtService.extractEmail(token)).isEqualTo("john@acme.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(7L);
        assertThat(jwtService.extractRole(token)).isEqualTo("MANAGER");
    }

    @Test
    void isTokenValid_returnsTrue_forFreshlyGeneratedToken() {
        String token = jwtService.generateToken(user(7L, CompanyRole.USER));

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalse_forGarbageToken() {
        assertThat(jwtService.isTokenValid("not-a-jwt")).isFalse();
    }

    @Test
    void isTokenValid_returnsFalse_whenTokenWasSignedWithDifferentSecret() {
        JwtService other = new JwtService("another-secret-key-that-is-32-chars!!", EXPIRATION_MS);
        String token = other.generateToken(user(7L, CompanyRole.USER));

        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalse_forExpiredToken() {
        JwtService expired = new JwtService(SECRET, -1000);
        String token = expired.generateToken(user(7L, CompanyRole.USER));

        assertThat(jwtService.isTokenValid(token)).isFalse();
    }
}
