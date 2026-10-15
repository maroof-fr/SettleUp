package com.settleup.dto;

import com.settleup.entity.Direction;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Request/response shapes. Field names match what frontend/js/api.js expects. */
public final class Dto {
    private Dto() {}

    public record RegisterRequest(
        @NotBlank(message = "Name is required.") @Size(max = 80) String name,
        @NotBlank(message = "Email is required.") @Email(message = "Enter a valid email.") String email,
        @NotBlank @Size(min = 8, max = 100, message = "Password must be 8 to 100 characters.") String password) {}
    public record LoginRequest(@NotBlank(message = "Email is required.") String email, @NotBlank(message = "Password is required.") String password) {}
    public record UserDto(Long id, String name, String email) {}
    public record AuthResponse(String token, UserDto user) {}

    public record FriendRequest(@NotBlank(message = "Friend name is required.") @Size(max = 80) String name,
                                @Email(message = "Enter a valid email or leave it empty.") String email) {}
    public record FriendDto(Long id, String name, String email) {}

    public record DebtRequest(
        @NotNull(message = "Choose a friend.") Long friendId,
        @NotNull(message = "Choose a direction.") Direction direction,
        @Positive(message = "Amount must be greater than zero.") long amountPaise,
        @NotBlank(message = "Description is required.") @Size(max = 120) String description,
        @NotNull(message = "Transaction date is required.") LocalDate date,
        LocalDate dueDate,
        @Size(max = 500) String notes) {}
    public record DebtDto(Long id, Long friendId, String friendName, Direction direction, long amountPaise, long repaidPaise,
                          long outstandingPaise, String status, String description, LocalDate date, LocalDate dueDate, String notes) {}

    public record PaymentRequest(@Positive(message = "Repayment must be greater than zero.") long amountPaise,
                                 @NotNull(message = "Repayment date is required.") LocalDate date, @Size(max = 80) String note) {}
    public record PaymentDto(Long id, long amountPaise, LocalDate date, String note) {}

    /** netPaise > 0: the friend owes you. netPaise < 0: you owe the friend. */
    public record BalanceDto(Long friendId, String friendName, long netPaise, int openDebts) {}
}
