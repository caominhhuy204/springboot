package com.nhom04.english.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;

import lombok.RequiredArgsConstructor;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public void sendEmail(String to, String subject, String content) {
        if (mailSender == null) {
            throw new IllegalStateException("Email is not configured. Set spring.mail.* properties to enable email sending.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);

        mailSender.send(message);
    }
}
