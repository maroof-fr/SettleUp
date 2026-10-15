package com.settleup.service;

import com.settleup.dto.Dto.*;
import com.settleup.entity.Friend;
import com.settleup.repository.FriendRepository;
import com.settleup.repository.UserRepository;
import com.settleup.web.ApiException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class FriendService {
    private final FriendRepository friends;
    private final UserRepository users;
    private final DebtService debts;

    public List<FriendDto> list(Long uid) { return friends.findByOwnerIdAndActiveTrueOrderByNameAsc(uid).stream().map(this::dto).toList(); }

    @Transactional
    public FriendDto add(Long uid, FriendRequest r) {
        String email = r.email() == null || r.email().isBlank() ? null : r.email().trim();
        if (email != null && friends.existsByOwnerIdAndActiveTrueAndEmailIgnoreCase(uid, email))
            throw new ApiException(HttpStatus.CONFLICT, "You already added this friend.");
        Friend f = new Friend();
        f.setOwner(users.getReferenceById(uid)); f.setName(r.name().trim()); f.setEmail(email);
        return dto(friends.save(f));
    }

    @Transactional
    public void remove(Long uid, Long id) {
        Friend f = friends.findByIdAndOwnerIdAndActiveTrue(id, uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Friend not found."));
        if (debts.hasOpenDebts(uid, id)) throw new ApiException(HttpStatus.CONFLICT, "Settle open debts with this friend before removing them.");
        f.setActive(false);
    }

    private FriendDto dto(Friend f) { return new FriendDto(f.getId(), f.getName(), f.getEmail()); }
}
