# # ===============================
# # CBC Disease Prediction - XGBoost (Binary)
# # ===============================

# import pandas as pd
# import joblib

# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import MinMaxScaler, LabelEncoder
# from sklearn.metrics import classification_report, accuracy_score
# from xgboost import XGBClassifier

# # ===============================
# # 1. Load Dataset
# # ===============================
# DATA_PATH = "C:/Users/Ritika/OneDrive/Desktop/FYP-1 Work/project/dataset/cbc_information.csv"

# df = pd.read_csv(DATA_PATH)

# # Normalize column names
# df.columns = df.columns.str.strip().str.lower()

# print("\nDataset Preview:")
# print(df.head())

# # ===============================
# # 2. Check Label Column
# # ===============================
# if "label" not in df.columns:
#     raise ValueError("❌ 'label' column not found in dataset")

# print("\nUnique labels in dataset:", df["label"].unique())

# # ===============================
# # 3. Split Features & Target
# # ===============================
# X = df.drop("label", axis=1)
# y = df["label"]

# # ===============================
# # 4. Encode Target Labels
# # ===============================
# label_encoder = LabelEncoder()
# y_encoded = label_encoder.fit_transform(y)

# num_classes = len(label_encoder.classes_)
# print("\nEncoded classes:", label_encoder.classes_)
# print("Number of classes:", num_classes)

# # ❌ Safety Check
# if num_classes < 2:
#     raise ValueError(
#         "❌ Dataset must contain at least 2 classes (e.g., Normal & Abnormal)"
#     )

# # ===============================
# # 5. Train-Test Split
# # ===============================
# X_train, X_test, y_train, y_test = train_test_split(
#     X,
#     y_encoded,
#     test_size=0.2,
#     random_state=42,
#     stratify=y_encoded
# )

# # ===============================
# # 6. Feature Scaling
# # ===============================
# scaler = MinMaxScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# # ===============================
# # 7. XGBoost Model (BINARY)
# # ===============================
# model = XGBClassifier(
#     n_estimators=200,
#     max_depth=4,
#     learning_rate=0.1,
#     subsample=0.8,
#     colsample_bytree=0.8,
#     objective="binary:logistic",
#     eval_metric="logloss",
#     random_state=42,
#     use_label_encoder=False
# )

# # ===============================
# # 8. Train Model
# # ===============================
# print("\nTraining XGBoost model...")
# model.fit(X_train_scaled, y_train)

# # ===============================
# # 9. Evaluate Model
# # ===============================
# y_pred = model.predict(X_test_scaled)

# accuracy = accuracy_score(y_test, y_pred)

# print("\n✅ Model Accuracy:", accuracy)
# print("\nClassification Report:\n")
# print(
#     classification_report(
#         y_test,
#         y_pred,
#         target_names=label_encoder.classes_
#     )
# )

# # ===============================
# # 10. Save Model & Preprocessors
# # ===============================
# joblib.dump(model, "xgb_model.pkl")
# joblib.dump(scaler, "scaler.pkl")
# joblib.dump(label_encoder, "label_encoder.pkl")

# print("\n🎉 Model training completed successfully!")
# print("Saved files:")
# print("✔ xgb_model.pkl")
# print("✔ scaler.pkl")
# print("✔ label_encoder.pkl")


import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

DATA_PATH = "C:/Users/Ritika/OneDrive/Desktop/FYP-1 Work/project/dataset/cbc_information.csv"

df = pd.read_csv(DATA_PATH)

# Rename columns to match parser keys
df.columns = df.columns.str.lower()

X = df.drop("label", axis=1)
y = df["label"]

encoder = LabelEncoder()
y_enc = encoder.fit_transform(y)

model = XGBClassifier(
    n_estimators=150,
    learning_rate=0.05,
    max_depth=5,
    missing=float("nan"),
    eval_metric="mlogloss"
)

model.fit(X, y_enc)

joblib.dump(model, "xgb_model.pkl")
joblib.dump(encoder, "label_encoder.pkl")

print("✅ Robust CBC model trained (missing-safe)")
