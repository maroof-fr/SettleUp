package com.settleup.repository;

import com.settleup.entity.Debt;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DebtRepository extends JpaRepository<Debt, Long> {
    // Every query is scoped to the owner so one user can never read another user's data.
    @EntityGraph(attributePaths = "friend") List<Debt> findByOwnerIdOrderByDateDescIdDesc(Long ownerId);
    @EntityGraph(attributePaths = "friend") Optional<Debt> findByIdAndOwnerId(Long id, Long ownerId);
    @EntityGraph(attributePaths = "friend") List<Debt> findByOwnerIdAndFriendId(Long ownerId, Long friendId);

    /** Row lock so two simultaneous repayments cannot overpay the same debt. Call inside a transaction. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Debt d where d.id = :id and d.owner.id = :uid")
    Optional<Debt> lockOwned(@Param("id") Long id, @Param("uid") Long uid);
}
