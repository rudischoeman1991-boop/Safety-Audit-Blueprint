import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute bottom-[0%] -left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl z-10">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-white mb-2">OHSA Audit Pro</h1>
          <p className="text-slate-400 mb-8">
            Professional compliance auditing platform for South African safety standards.
          </p>

          <Button 
            size="lg" 
            className="w-full h-12 text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] transition-all"
            onClick={handleLogin}
          >
            Sign In with Replit
          </Button>

          <p className="text-xs text-slate-500 mt-6">
            Secure enterprise access only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
