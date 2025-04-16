import { ChatBubbleLeftRightIcon, MapPinIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Muammer Utku Ozdil</h1>
          <p className="text-xl font-medium text-gray-700 mb-4">Senior Software Engineer</p>
          
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>Ankara, Turkey</span>
            </div>
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              <span>utkuozdil@gmail.com</span>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-600 leading-relaxed">
              Results-driven Senior Software Engineer with over 9 years of experience designing and implementing scalable, cloud-native
              solutions. Proven expertise in Python, AWS, and serverless technologies, with a strong ability to solve complex technical
              problems, drive innovation, and deliver business value across remote, cross-functional teams.
            </p>
          </div>
        </div>

        {/* Professional Links */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* LinkedIn */}
            <a 
              href="https://www.linkedin.com/in/utkuozdil/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
            >
              <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <div className="ml-6">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">LinkedIn</h3>
                <p className="text-gray-600">Connect with me on LinkedIn</p>
              </div>
            </a>

            {/* GitHub */}
            <a 
              href="https://github.com/utkuozdil"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300 group"
            >
              <svg className="h-8 w-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <div className="ml-6">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">GitHub</h3>
                <p className="text-gray-600">Check out my projects and contributions</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact 