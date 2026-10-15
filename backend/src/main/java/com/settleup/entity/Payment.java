package com.settleup.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "payments", indexes = @Index(columnList = "debt_id")) @Getter @Setter @NoArgsConstructor
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Debt debt;
    @Column(nullable = false) private long amountPaise;
    @Column(name = "payment_date", nullable = false) private LocalDate date;
    @Column(length = 80) private String note;
}
