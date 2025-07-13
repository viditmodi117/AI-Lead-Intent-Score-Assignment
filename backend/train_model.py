import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

# Loading dataset
data = pd.read_csv('../data/real_estate_leads.csv')

# Preparing features
X = data[['credit_score', 'income', 'budget']]
X = pd.concat([X, pd.get_dummies(data['age_group'], prefix='age_group')], axis=1)
X = pd.concat([X, pd.get_dummies(data['family_background'], prefix='family_background')], axis=1)
X = pd.concat([X, pd.get_dummies(data['property_type'], prefix='property_type')], axis=1)
X = pd.concat([X, pd.get_dummies(data['preferred_location'], prefix='preferred_location')], axis=1)
y = data['lead_intent']

# Splitting data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scaling features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Training model
model = GradientBoostingClassifier(random_state=42)
model.fit(X_train, y_train)

# Saving model
joblib.dump(model, 'model/lead_scoring_model.joblib')

# Evaluating model
print("Model accuracy:", model.score(X_test, y_test))