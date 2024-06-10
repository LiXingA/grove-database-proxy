import java.nio.file.Paths;

class QuickStart {
    public static void main (String[] args) {
        System.out.println(QuickStart.class);
        System.out.println(Paths.get("./").toFile().getAbsolutePath());
    }
}