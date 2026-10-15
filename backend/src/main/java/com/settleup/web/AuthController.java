package com.settleup.web;

import com.settleup.dto.Dto.*;
import com.settleup.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;

    @PostMapping("/auth/register") @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest r) { return auth.register(r); }

    @PostMapping("/auth/login")
    AuthResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }

    @GetMapping("/users/me")
    UserDto me(@AuthenticationPrincipal Long uid) { return auth.me(uid); }
}
