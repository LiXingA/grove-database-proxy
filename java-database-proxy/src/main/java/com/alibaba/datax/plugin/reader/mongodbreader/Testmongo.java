package com.alibaba.datax.plugin.reader.mongodbreader;

import java.util.Arrays;
import java.util.Collection;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.alibaba.datax.common.util.Configuration;
import com.mongodb.client.model.Filters;

import org.bson.conversions.Bson;

public class Testmongo {

    static Pattern p = Pattern.compile("^mb\\.regex\\.(contains|notContains)\\(\"(.*)\"\\)$");

    public static void main3(String[] args) {
        System.out.println(Arrays.asList(1, 2, 3) instanceof Collection);
    }

    public static void main2(String[] args) {
        Configuration conf = Configuration.from("{}");
        Integer a = conf.getInt("port");
        System.out.println(a);
    }

    public static void main(String[] args) {
        String patternStr = ".son.";
        Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
        Bson filter = Filters.regex("username", pattern);
        System.out.println(filter.toString());
        String str = "mb.regex.notContains(\"adfasdfasdf\")";
        // System.out.println(p.matcher(str).matches());
        Matcher matcher = p.matcher(str);
        while (matcher.find()) {
            System.out.println(matcher.group(2));
        }
    }

}
