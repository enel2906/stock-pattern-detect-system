# main.py
from vnstock_data import Company
import pandas as pd

def main():
    # Hiển thị DataFrame đầy đủ trong terminal (tuỳ bạn có cần không)
    pd.set_option("display.max_columns", None)
    pd.set_option("display.max_rows", None)
    pd.set_option("display.width", None)
    pd.set_option("display.max_colwidth", None)

    company = Company(symbol="VCB", source="vci")
    print("Created company object")

    df = company.overview()
    print("overview() returned:", type(df))

    # 1) Lưu dạng CSV bình thường
    df.to_csv("overview.csv", index=False, encoding="utf-8-sig")

    # 2) Lưu dạng “in dọc” (mỗi cột một dòng: key: value)
    vertical_path = "overview_vertical.txt"
    with open(vertical_path, "w", encoding="utf-8") as f:
        if df.empty:
            f.write("DataFrame is empty.\n")
        else:
            row = df.iloc[0].to_dict()  # lấy dòng đầu tiên
            for k, v in row.items():
                f.write(f"{k}: {v}\n")

    # 3) (Tuỳ chọn) Lưu df.T ra CSV (dạng bảng đã transpose)
    df.T.to_csv("overview_transposed.csv", header=False, encoding="utf-8-sig")

    print("Saved files:")
    print("- overview.csv")
    print("- overview_vertical.txt")
    print("- overview_transposed.csv")

if __name__ == "__main__":
    main()
