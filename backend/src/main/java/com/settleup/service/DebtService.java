package com.settleup.service;

import com.settleup.dto.Dto.*;
import com.settleup.entity.*;
import com.settleup.repository.*;
import com.settleup.web.ApiException;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** All money rules live here. The frontend is never trusted for balances or validation. */
@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class DebtService {
    private final DebtRepository debts;
    private final PaymentRepository payments;
    private final FriendRepository friends;
    private final UserRepository users;

    public List<DebtDto> list(Long uid) {
        Map<Long, Long> sums = sums(uid);
        return debts.findByOwnerIdOrderByDateDescIdDesc(uid).stream().map(d -> dto(d, sums.getOrDefault(d.getId(), 0L))).toList();
    }

    public DebtDto get(Long uid, Long id) { Debt d = owned(uid, id); return dto(d, payments.sumByDebt(d.getId())); }

    @Transactional
    public DebtDto create(Long uid, DebtRequest r) {
        Debt d = new Debt();
        d.setOwner(users.getReferenceById(uid));
        apply(d, r, friend(uid, r.friendId()));
        return dto(debts.save(d), 0);
    }

    @Transactional
    public DebtDto update(Long uid, Long id, DebtRequest r) {
        Debt d = lock(uid, id);
        long repaid = payments.sumByDebt(id);
        if (r.amountPaise() < repaid) throw new ApiException(HttpStatus.CONFLICT, "Amount cannot be lower than what is already repaid.");
        apply(d, r, friend(uid, r.friendId()));
        return dto(d, repaid);
    }

    @Transactional
    public void delete(Long uid, Long id) {
        Debt d = lock(uid, id);
        if (payments.existsByDebtId(id)) throw new ApiException(HttpStatus.CONFLICT, "A debt with repayments cannot be deleted.");
        debts.delete(d);
    }

    public List<PaymentDto> payments(Long uid, Long id) {
        owned(uid, id);
        return payments.findByDebtIdOrderByDateDescIdDesc(id).stream().map(p -> new PaymentDto(p.getId(), p.getAmountPaise(), p.getDate(), p.getNote())).toList();
    }

    /** A repayment lowers the outstanding amount only; the original amountPaise never changes. */
    @Transactional
    public PaymentDto addPayment(Long uid, Long id, PaymentRequest r) {
        Debt d = lock(uid, id); // row lock: concurrent repayments are serialized
        long outstanding = d.getAmountPaise() - payments.sumByDebt(id);
        if (r.amountPaise() > outstanding) throw new ApiException(HttpStatus.CONFLICT, "Repayment cannot exceed the remaining balance.");
        Payment p = new Payment();
        p.setDebt(d); p.setAmountPaise(r.amountPaise()); p.setDate(r.date()); p.setNote(r.note() == null ? null : r.note().trim());
        payments.save(p);
        return new PaymentDto(p.getId(), p.getAmountPaise(), p.getDate(), p.getNote());
    }

    /** Net per friend from outstanding amounts. Individual debt records are never merged or deleted. */
    public List<BalanceDto> balances(Long uid) {
        Map<Long, Long> sums = sums(uid);
        Map<Long, long[]> acc = new HashMap<>(); // friendId -> [net, openCount]
        for (Debt d : debts.findByOwnerIdOrderByDateDescIdDesc(uid)) {
            long out = d.getAmountPaise() - sums.getOrDefault(d.getId(), 0L);
            if (out == 0) continue;
            long[] a = acc.computeIfAbsent(d.getFriend().getId(), k -> new long[2]);
            a[0] += d.getDirection() == Direction.LENT ? out : -out;
            a[1]++;
        }
        return friends.findByOwnerIdAndActiveTrueOrderByNameAsc(uid).stream().map(f -> {
            long[] a = acc.getOrDefault(f.getId(), new long[2]);
            return new BalanceDto(f.getId(), f.getName(), a[0], (int) a[1]);
        }).toList();
    }

    boolean hasOpenDebts(Long uid, Long friendId) {
        Map<Long, Long> sums = sums(uid);
        return debts.findByOwnerIdAndFriendId(uid, friendId).stream().anyMatch(d -> d.getAmountPaise() > sums.getOrDefault(d.getId(), 0L));
    }

    // ---- helpers ----
    private Map<Long, Long> sums(Long uid) {
        Map<Long, Long> m = new HashMap<>();
        for (Object[] row : payments.sumsByOwner(uid)) m.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        return m;
    }
    private Debt owned(Long uid, Long id) { return debts.findByIdAndOwnerId(id, uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Debt not found.")); }
    private Debt lock(Long uid, Long id) { return debts.lockOwned(id, uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Debt not found.")); }
    private Friend friend(Long uid, Long id) {
        return friends.findByIdAndOwnerIdAndActiveTrue(id, uid).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Choose one of your friends."));
    }
    private void apply(Debt d, DebtRequest r, Friend f) {
        if (r.dueDate() != null && r.dueDate().isBefore(r.date())) throw new ApiException(HttpStatus.BAD_REQUEST, "The due date cannot be before the transaction date.");
        d.setFriend(f); d.setDirection(r.direction()); d.setAmountPaise(r.amountPaise()); d.setDescription(r.description().trim());
        d.setDate(r.date()); d.setDueDate(r.dueDate()); d.setNotes(r.notes() == null ? null : r.notes().trim());
    }
    private DebtDto dto(Debt d, long repaid) {
        long out = d.getAmountPaise() - repaid;
        String status = out == 0 ? "PAID" : d.getDueDate() != null && d.getDueDate().isBefore(LocalDate.now()) ? "OVERDUE" : repaid > 0 ? "PARTIAL" : "OPEN";
        return new DebtDto(d.getId(), d.getFriend().getId(), d.getFriend().getName(), d.getDirection(), d.getAmountPaise(), repaid, out, status,
            d.getDescription(), d.getDate(), d.getDueDate(), d.getNotes());
    }
}
