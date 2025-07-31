import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">About Us</h1>
        <div className="prose prose-lg text-foreground space-y-6">
          <p className="text-xl leading-relaxed">
            Why is it so hard to figure out if a restaurant or bar has a happy hour?
          </p>
          
          <p className="text-2xl font-bold text-primary">
            FRET NO MORE!
          </p>
          
          <p className="text-lg leading-relaxed">
            SipMunchYap is the newest and greatest way to discover happy hours, deals, and offers from local restaurants and bars.
          </p>
          
          <p className="text-lg leading-relaxed">
            If you found this, we're currently operating in beta. We're also operating only in NY! We'll be adding more restaurants and bars every single week, so be sure to check back in and see what's new!
          </p>
          
          <p className="text-lg leading-relaxed font-medium">
            Start planning your next social outing with your homies so you can sip, munch, and yap!
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;