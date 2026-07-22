package com.example.demo.service;

import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

  @Value("${sendgrid.api-key}")
  private String apiKey;

  @Value("${sendgrid.from-email}")
  private String fromEmail;

  @Value("${sendgrid.from-name}")
  private String fromName;

  @Value("${app.frontend-url}")
  private String frontendUrl;

  public void sendTemporaryPassword(String toEmail, String recipientName, String tempPassword) {
    String subject = "Your PlanoScan account has been created";
    String body =
        """
        <p>Hi %s,</p>
        <p>An account has been created for you on PlanoScan.</p>
        <p><b>Email:</b> %s<br/>
        <b>Temporary password:</b> %s</p>
        <p>Please <a href="%s">log in</a> and change this password as soon as possible.</p>
        <p>If you were not expecting this email, please contact your administrator.</p>
        """
            .formatted(recipientName, toEmail, tempPassword, frontendUrl);

    Mail mail =
        new Mail(
            new Email(fromEmail, fromName),
            subject,
            new Email(toEmail),
            new Content("text/html", body));

    Request request = new Request();
    try {
      request.setMethod(Method.POST);
      request.setEndpoint("mail/send");
      request.setBody(mail.build());

      Response response = new SendGrid(apiKey).api(request);
      if (response.getStatusCode() >= 300) {
        log.error(
            "SendGrid returned status {} while emailing {}: {}",
            response.getStatusCode(),
            toEmail,
            response.getBody());
        throw new ServerException(ErrorCode.EMAIL_SEND_FAILED);
      }
    } catch (ServerException e) {
      throw e;
    } catch (Exception e) {
      log.error("Failed to send temporary password email to {}", toEmail, e);
      throw new ServerException(ErrorCode.EMAIL_SEND_FAILED);
    }
  }
}
