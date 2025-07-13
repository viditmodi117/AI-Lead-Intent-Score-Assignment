import { useState, useEffect } from 'react';
import './styles.css';

function App() {
  const [leads, setLeads] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    credit_score: '',
    income: '',
    budget: '',
    preferred_location: '',
    comments: '',
    consent: false,
  });
  const [error, setError] = useState('');

  // Load leads from localStorage on mount
  useEffect(() => {
    const savedLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    setLeads(savedLeads);
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent) {
      setError('Please consent to data processing');
      return;
    }
    if (!formData.email.includes('@') || formData.credit_score < 300 || formData.credit_score > 850 ||
        formData.income < 0 || formData.budget < 0) {
      setError('Please enter valid data: valid email, credit score 300-850, non-negative income/budget');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+91-0000000000', // Dummy value as not in form
          age_group: '26-35', // Dummy value as not in form
          family_background: 'Single', // Dummy value as not in form
          property_type: 'Apartment', // Dummy value as not in form
          ...formData,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        const newLead = {
          email: formData.email,
          initial_score: result.initial_score,
          reranked_score: result.reranked_score,
          comments: formData.comments,
        };
        const updatedLeads = [newLead, ...leads];
        setLeads(updatedLeads);
        localStorage.setItem('leads', JSON.stringify(updatedLeads));
        setFormData({
          email: '',
          credit_score: '',
          income: '',
          budget: '',
          preferred_location: '',
          comments: '',
          consent: false,
        });
        setError('');
      } else {
        setError('Error scoring lead: ' + result.detail);
      }
    } catch (err) {
      setError('Error connecting to backend: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Lead Scoring Dashboard</h1>
      
      {/* Form Section */}
      <div className="bg-white p-4 md:p-6 rounded shadow-md mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Enter Lead Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2 text-sm"
              placeholder="john.doe@test.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Credit Score (300-850)</label>
            <input
              type="number"
              name="credit_score"
              value={formData.credit_score}
              onChange={handleInputChange}
              min="300"
              max="850"
              className="mt-1 block w-full border rounded p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Income (INR)</label>
            <input
              type="number"
              name="income"
              value={formData.income}
              onChange={handleInputChange}
              min="0"
              className="mt-1 block w-full border rounded p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Budget (INR)</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              min="0"
              className="mt-1 block w-full border rounded p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Preferred Location</label>
            <select
              name="preferred_location"
              value={formData.preferred_location}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2 text-sm"
              required
            >
              <option value="">Select Location</option>
              <option value="Noida">Noida</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Surat">Surat</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2 text-sm"
              placeholder="Enter comments"
            ></textarea>
          </div>
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleInputChange}
                className="h-4 w-4"
                required
              />
              <span className="ml-2 text-sm">I consent to data processing</span>
            </label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white p-4 md:p-6 rounded shadow-md">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Scored Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Initial Score</th>
                <th className="border p-2 text-left">Reranked Score</th>
                <th className="border p-2 text-left">Comments</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border p-2">{lead.email}</td>
                  <td className="border p-2">{lead.initial_score}</td>
                  <td className="border p-2">{lead.reranked_score}</td>
                  <td className="border p-2">{lead.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;