package com.settleup.service;

import com.settleup.dto.Dto.*;
import com.settleup.entity.User;
import com.settleup.repository.UserRepository;
import com.settleup.security.JwtService;
import com.settleup.web.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        User u = new User();
        u.setName(r.name().trim()); u.setEmail(email); u.setPasswordHash(encoder.encode(r.password()));
        users.save(u);
        return new AuthResponse(jwt.create(u.getId()), dto(u));
    }

    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase()).filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.")); // same message for both cases
        return new AuthResponse(jwt.create(u.getId()), dto(u));
    }

    public UserDto me(Long userId) {
        return dto(users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Session expired.")));
    }

    private UserDto dto(User u) { return new UserDto(u.getId(), u.getName(), u.getEmail()); }
}
