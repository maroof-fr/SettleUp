package com.settleup.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long ttlMillis;

    public JwtService(@Value("${settleup.jwt.secret}") String secret, @Value("${settleup.jwt.ttl-minutes}") long ttlMinutes) {
        if (secret.length() < 32) throw new IllegalStateException("JWT_SECRET must be at least 32 characters.");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMillis = ttlMinutes * 60_000;
    }

    public String create(Long userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder().subject(userId.toString()).issuedAt(new Date(now)).expiration(new Date(now + ttlMillis)).signWith(key).compact();
    }

    /** Returns the user id, or throws a JwtException / IllegalArgumentException if the token is invalid or expired. */
    public Long parse(String token) {
        return Long.valueOf(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject());
    }
}
