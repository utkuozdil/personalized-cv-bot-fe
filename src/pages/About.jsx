import { 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  LightBulbIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline'

function About() {
  const features = [
    {
      icon: <DocumentTextIcon className="h-6 w-6" />,
      title: "CV Analysis",
      description: "Upload your CV in PDF format and let our AI analyze your professional experience, skills, and qualifications."
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      title: "Interactive Chat",
      description: "Engage in natural conversations about your career history, skills, and experiences with our AI assistant."
    },
    {
      icon: <LightBulbIcon className="h-6 w-6" />,
      title: "Smart Insights",
      description: "Get personalized insights and detailed information about your professional background through intelligent analysis."
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      title: "Secure Processing",
      description: "Your CV is processed securely and your data is handled with strict privacy measures."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About CV Chat Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent companion for exploring and understanding your professional journey
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                1
              </div>
              <p className="text-lg text-gray-700 flex-1 text-left">
                Upload your CV in PDF format through our secure interface
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                2
              </div>
              <p className="text-lg text-gray-700 flex-1 text-left">
                Our AI processes and analyzes your CV content
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                3
              </div>
              <p className="text-lg text-gray-700 flex-1 text-left">
                Start chatting and get detailed insights about your professional background
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About 