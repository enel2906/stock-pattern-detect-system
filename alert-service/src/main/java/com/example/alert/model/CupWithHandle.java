package com.example.alert.model;

public class CupWithHandle {
    private int leftHighIndex;
    private double leftHighValue;
    private int rightHighIndex;
    private double rightHighValue;
    private int dipIndex;
    private double dipValue;
    private int lowHandleIndex;
    private double lowHandleValue;

    public void setLeftHigh(int index, double value) {
        this.leftHighIndex = index;
        this.leftHighValue = value;
    }

    public void setRightHigh(int index, double value) {
        this.rightHighIndex = index;
        this.rightHighValue = value;
    }

    public void setDip(int index, double value) {
        this.dipIndex = index;
        this.dipValue = value;
    }

    public void setLowHandle(int index, double value) {
        this.lowHandleIndex = index;
        this.lowHandleValue = value;
    }

    @Override
    public String toString() {
        return "CupWithHandle{" +
                "LeftHigh=" + leftHighValue +
                ", RightHigh=" + rightHighValue +
                ", Dip=" + dipValue +
                ", LowHandle=" + lowHandleValue +
                '}';
    }
}

