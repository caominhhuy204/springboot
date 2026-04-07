package com.nhom04.english.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${MAIL_FROM:${MAIL_USERNAME:}}") String fromAddress) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.fromAddress = fromAddress;
    }

    public void sendEmail(String to, String subject, String content) {
        if (mailSender == null) {
            throw new IllegalStateException("Email is not configured. Set spring.mail.* properties to enable email sending.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress.trim());
        }
        message.setSubject(subject);
        message.setText(content);

        mailSender.send(message);
    }
}
