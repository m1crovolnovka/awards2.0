package com.groupawards.config;

import com.groupawards.entity.Nomination;
import com.groupawards.entity.Nominee;
import com.groupawards.repository.NominationRepository;
import com.groupawards.repository.NomineeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Set;
import javax.imageio.ImageIO;

@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class DemoDataBootstrap implements CommandLineRunner {

    private final NomineeRepository nomineeRepository;
    private final NominationRepository nominationRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (nominationRepository.count() > 0) {
            return;
        }
        // Clear orphan nominees from failed earlier attempts so demo set is clean
        if (nomineeRepository.count() > 0 && nominationRepository.count() == 0) {
            nomineeRepository.deleteAll();
        }

        Nominee alex = saveNominee("Алекс", "Александр Иванов", new Color(225, 6, 0));
        Nominee maria = saveNominee("Мария", "Мария Петрова", new Color(255, 135, 0));
        Nominee denis = saveNominee("Денис", "Денис Козлов", new Color(42, 171, 238));
        Nominee ira = saveNominee("Ира", "Ирина Смирнова", new Color(120, 80, 200));
        Nominee max = saveNominee("Макс", "Максим Орлов", new Color(40, 180, 90));
        Nominee katya = saveNominee("Катя", "Екатерина Волкова", new Color(230, 60, 120));

        saveNomination(
                "Гонщик года",
                "Самый быстрый и решительный в учёбе и жизни",
                new Color(14, 21, 36),
                Set.of(alex, maria, denis, max)
        );
        saveNomination(
                "Душа компании",
                "Тот, без кого вечеринка не вечеринка",
                new Color(30, 10, 20),
                Set.of(maria, ira, katya, denis)
        );
        saveNomination(
                "Мем лорд",
                "Король чата и поставщик настроения",
                new Color(20, 25, 40),
                Set.of(alex, max, ira, katya)
        );

        log.info("Seeded demo nominees and nominations");
    }

    private Nominee saveNominee(String name, String reportName, Color color) {
        Nominee n = Nominee.builder()
                .name(name)
                .reportName(reportName)
                .imageData(png(name, color, 400, 480))
                .imageContentType("image/png")
                .build();
        return nomineeRepository.save(n);
    }

    private void saveNomination(String title, String description, Color color, Set<Nominee> nominees) {
        Nomination nomination = Nomination.builder()
                .title(title)
                .description(description)
                .imageData(png(title, color, 800, 450))
                .imageContentType("image/png")
                .nominees(nominees)
                .build();
        nominationRepository.save(nomination);
    }

    private byte[] png(String label, Color bg, int w, int h) {
        try {
            BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(bg);
            g.fillRect(0, 0, w, h);
            g.setColor(new Color(225, 6, 0));
            g.fillRect(0, 0, 12, h);
            g.setColor(Color.WHITE);
            g.setFont(new Font("SansSerif", Font.BOLD, Math.max(28, w / 18)));
            g.drawString(label.toUpperCase(), 36, h / 2);
            g.dispose();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (Exception e) {
            return new byte[0];
        }
    }
}
