package com.settleup.repository;

import com.settleup.entity.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByDebtIdOrderByDateDescIdDesc(Long debtId);
    boolean existsByDebtId(Long debtId);

    @Query("select coalesce(sum(p.amountPaise), 0) from Payment p where p.debt.id = :id")
    long sumByDebt(@Param("id") Long id);

    /** Rows of [debtId, repaidPaise] for all of a user's debts, in one query. */
    @Query("select p.debt.id, sum(p.amountPaise) from Payment p where p.debt.owner.id = :uid group by p.debt.id")
    List<Object[]> sumsByOwner(@Param("uid") Long uid);
}
