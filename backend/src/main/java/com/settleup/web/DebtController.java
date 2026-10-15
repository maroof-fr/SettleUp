package com.settleup.web;

import com.settleup.dto.Dto.*;
import com.settleup.service.DebtService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class DebtController {
    private final DebtService debts;

    @GetMapping("/debts") List<DebtDto> list(@AuthenticationPrincipal Long uid) { return debts.list(uid); }
    @GetMapping("/debts/{id}") DebtDto get(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return debts.get(uid, id); }

    @PostMapping("/debts") @ResponseStatus(HttpStatus.CREATED)
    DebtDto create(@AuthenticationPrincipal Long uid, @Valid @RequestBody DebtRequest r) { return debts.create(uid, r); }

    @PutMapping("/debts/{id}")
    DebtDto update(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody DebtRequest r) { return debts.update(uid, id, r); }

    @DeleteMapping("/debts/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal Long uid, @PathVariable Long id) { debts.delete(uid, id); }

    @GetMapping("/debts/{id}/payments")
    List<PaymentDto> payments(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return debts.payments(uid, id); }

    @PostMapping("/debts/{id}/payments") @ResponseStatus(HttpStatus.CREATED)
    PaymentDto pay(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody PaymentRequest r) { return debts.addPayment(uid, id, r); }

    @GetMapping("/balances") List<BalanceDto> balances(@AuthenticationPrincipal Long uid) { return debts.balances(uid); }
}
