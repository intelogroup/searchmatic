import React from 'react'
import { Sparkles } from 'lucide-react'

export const FooterSection: React.FC = () => {
  return (
    <footer className="py-12 border-t" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Searchmatic</span>
            </div>
            <p className="text-muted-foreground">
              Making systematic literature reviews accessible to researchers worldwide.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground">Integrations</a></li>
              <li><a href="#" className="hover:text-foreground">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
              <li><a href="#" className="hover:text-foreground">Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Searchmatic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}