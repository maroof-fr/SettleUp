package com.settleup.web;

import com.settleup.dto.Dto.*;
import com.settleup.service.FriendService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/friends") @RequiredArgsConstructor
public class FriendController {
    private final FriendService friends;

    @GetMapping List<FriendDto> list(@AuthenticationPrincipal Long uid) { return friends.list(uid); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    FriendDto add(@AuthenticationPrincipal Long uid, @Valid @RequestBody FriendRequest r) { return friends.add(uid, r); }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    void remove(@AuthenticationPrincipal Long uid, @PathVariable Long id) { friends.remove(uid, id); }
}
