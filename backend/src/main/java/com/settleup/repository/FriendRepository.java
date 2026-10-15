package com.settleup.repository;

import com.settleup.entity.Friend;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByOwnerIdAndActiveTrueOrderByNameAsc(Long ownerId);
    Optional<Friend> findByIdAndOwnerIdAndActiveTrue(Long id, Long ownerId);
    boolean existsByOwnerIdAndActiveTrueAndEmailIgnoreCase(Long ownerId, String email);
}
