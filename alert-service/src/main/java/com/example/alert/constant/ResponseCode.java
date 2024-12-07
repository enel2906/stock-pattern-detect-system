package com.example.alert.constant;

import java.lang.reflect.Field;

public class ResponseCode {


    private static final ResponseCode instance = new ResponseCode();

    // === UMS ===//
    public static final int SUCCESS = 0;
    public static final int UNKNOWN_ERROR = 1;
    public static final int WRONG_DATA_FORMAT = 2;
}
