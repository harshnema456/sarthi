export default function SubscriptionPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      features: ['Basic features', 'Limited storage', 'Community support'],
      buttonText: 'Current Plan',
      buttonVariant: 'outline',
      current: true
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      features: ['All Free features', 'More storage', 'Priority support', 'Advanced analytics'],
      buttonText: 'Upgrade',
      buttonVariant: 'default',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: ['All Pro features', 'Unlimited storage', '24/7 support', 'Dedicated account manager'],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline'
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">My Subscription</h1>
        <p className="text-muted-foreground mb-8">Manage your subscription and billing information</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-6 ${
                plan.popular ? 'border-primary ring-2 ring-primary' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full inline-flex items-center mb-4">
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className={`w-full py-2 px-4 rounded-md ${
                  plan.buttonVariant === 'default' 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'border border-input hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Current Plan</h3>
              <p className="text-muted-foreground">Free Plan</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Next Billing Date</h3>
              <p className="text-muted-foreground">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
