package com.example.alert.service.impl;

import com.example.alert.model.CupWithHandle;
import com.example.alert.service.ComplexPatternDetectorService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ComplexPatternDetectorServiceImpl implements ComplexPatternDetectorService {

    @Override
    public CupWithHandle getNearestCupWithHandle(List<Double> smaValues) {
        final double FLUC = 0.1;
        final double CUP_DEPTH_RIGHT_MAX = 0.4;
        final double CUP_DEPTH_RIGHT_MIN = 0.15;
        final double CUP_DEPTH_LEFT_MAX = 0.45;
        final double CUP_DEPTH_LEFT_MIN = 0.18;
        final double HIGH_DIFF = 0.1;
        final double HANDLE_DEPTH = 0.15;
        final double MAX_PEAK_DIP = 0.85;

        CupWithHandle cwh = new CupWithHandle();
        int n = smaValues.size();
        int rh = n - 1;

        // Tìm Right High (Đỉnh phải)
        while (rh > 0 &&
                smaValues.get(rh - 1) != null &&
                smaValues.get(rh) != null &&
                (smaValues.get(rh - 1) >= smaValues.get(rh) ||
                        smaValues.get(rh - 1) >= (1 - FLUC) * smaValues.get(rh))) {
            rh--;
        }
        if (rh <= 0 || smaValues.get(rh) == null) return null;

        cwh.setRightHigh(rh, smaValues.get(rh));

        // Tìm Low Handle (Điểm thấp nhất trong tay cầm)
        int lowRight = rh;
        for (int j = rh; j < n - 1 &&
                smaValues.get(j) != null &&
                smaValues.get(j + 1) != null &&
                (smaValues.get(j + 1) <= smaValues.get(j) ||
                        smaValues.get(j + 1) <= (1 + FLUC) * smaValues.get(lowRight)); j++) {
            if (smaValues.get(j + 1) < smaValues.get(lowRight)) {
                lowRight = j + 1;
            }
        }
        if (smaValues.get(lowRight) == null) return null;

        cwh.setLowHandle(lowRight, smaValues.get(lowRight));

        // Kiểm tra độ sâu của tay cầm
        if (smaValues.get(rh) == null ||
                smaValues.get(lowRight) == null ||
                smaValues.get(rh) - smaValues.get(lowRight) > HANDLE_DEPTH * smaValues.get(rh) ||
                smaValues.get(rh) - smaValues.get(lowRight) <= 0) {
            return null;
        }

        // Tìm đáy cốc (Dip)
        int dip = rh - 1;
        while (dip > 0 &&
                smaValues.get(dip - 1) != null &&
                smaValues.get(dip) != null &&
                (smaValues.get(dip - 1) <= smaValues.get(dip) ||
                        smaValues.get(dip - 1) <= (1 + FLUC) * smaValues.get(dip) ||
                        smaValues.get(dip - 1) < MAX_PEAK_DIP * smaValues.get(rh))) {
            dip--;
        }
        if (dip <= 0 || smaValues.get(dip) == null) return null;

        cwh.setDip(dip, smaValues.get(dip));

        // Kiểm tra độ sâu của đáy cốc
        if (smaValues.get(rh) == null ||
                smaValues.get(dip) == null ||
                smaValues.get(rh) - smaValues.get(dip) < CUP_DEPTH_RIGHT_MIN * smaValues.get(rh) ||
                smaValues.get(rh) - smaValues.get(dip) > CUP_DEPTH_RIGHT_MAX * smaValues.get(rh)) {
            return null;
        }

        // Tìm Left High (Đỉnh trái)
        int lh = dip - 1;
        while (lh > 0 &&
                smaValues.get(lh - 1) != null &&
                smaValues.get(lh) != null &&
                (smaValues.get(lh - 1) >= smaValues.get(lh) ||
                        smaValues.get(lh - 1) >= (1 - FLUC) * smaValues.get(lh))) {
            lh--;
        }
        if (smaValues.get(lh) == null) return null;

        cwh.setLeftHigh(lh, smaValues.get(lh));

        // Kiểm tra độ sâu đáy cốc so với đỉnh trái
        if (smaValues.get(lh) == null ||
                smaValues.get(dip) == null ||
                smaValues.get(lh) - smaValues.get(dip) < CUP_DEPTH_LEFT_MIN * smaValues.get(lh) ||
                smaValues.get(lh) - smaValues.get(dip) > CUP_DEPTH_LEFT_MAX * smaValues.get(lh)) {
            return null;
        }

        // Kiểm tra chiều rộng cốc
        if (rh - lh < 25 || rh - lh > 130) {
            return null;
        }

        // Kiểm tra độ chênh lệch giữa hai đỉnh
        if (smaValues.get(rh) == null ||
                smaValues.get(lh) == null ||
                Math.abs(smaValues.get(rh) - smaValues.get(lh)) > HIGH_DIFF * smaValues.get(rh)) {
            return null;
        }

        return cwh;
    }
}
