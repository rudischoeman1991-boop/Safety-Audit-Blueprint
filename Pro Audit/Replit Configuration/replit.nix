{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.postgresql_15
    pkgs.nodePackages.nodemon
  ];
  
  env = {
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/safetyaudit";
  };
}