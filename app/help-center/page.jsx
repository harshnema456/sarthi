export default function HelpCenterPage() {
  const faqs = [
    {
      question: "How do I update my profile?",
      answer: "You can update your profile by going to Settings > Profile Information."
    },
    {
      question: "How can I change my password?",
      answer: "Navigate to Settings > Security to update your password."
    },
    {
      question: "Where can I find my subscription details?",
      answer: "Your subscription details are available in the My Subscription section."
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Help Center</h1>
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h3 className="font-medium">{faq.question}</h3>
                <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
          <p className="text-muted-foreground mb-4">Can't find what you're looking for? Our support team is here to help.</p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
